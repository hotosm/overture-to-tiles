"""
Parquet to GeoJSON/GeoJSONSeq Converter

This script converts a Parquet file containing geospatial data to GeoJSON or GeoJSONSeq format.
It uses all available CPU cores for parallel processing to maximize performance.

Install :
pip install click pyarrow shapely

Usage:

# Convert a Parquet file to GeoJSON
python parquet2geojson.py -i input.parquet -o output.geojson

# Convert a Parquet file to GeoJSONSeq
python parquet2geojson.py -i input.parquet -o output.geojsonseq -f geojsonseq

# Use 8 worker processes
python parquet2geojson.py -i input.parquet -o output.geojson -w 8
"""

import json
import multiprocessing as mp
import os

import click
import pyarrow.parquet as pq
import shapely.wkb


@click.command()
@click.option(
    "--input",
    "-i",
    type=click.Path(exists=True, dir_okay=False),
    required=True,
    help="Path to the input Parquet file.",
)
@click.option(
    "--output",
    "-o",
    type=click.Path(),
    required=True,
    help="Path to the output GeoJSON or GeoJSONSeq file.",
)
@click.option(
    "--format",
    "-f",
    type=click.Choice(["geojson", "geojsonseq"]),
    default="geojson",
    help="Output format (GeoJSON or GeoJSONSeq).",
)
@click.option(
    "--num-workers",
    "-w",
    type=int,
    default=1,
    help="Number of worker processes to use (default: number of CPU cores).",
)
def convert(input, output, format, num_workers):

    print(f"Read : {input}")
    print(f"Write : {format} - {output}")
    print(f"Workers: {num_workers}")
    pq_file = pq.ParquetFile(input)
    if num_workers > 1:
        pool = mp.Pool(processes=num_workers)
        batches = pool.imap(convert_batch, pq_file.iter_batches())
    else:
        batches = map(convert_batch, pq_file.iter_batches())

    with get_writer(format, output) as writer:
        for batch in batches:
            writer.write_batch(batch)


def flatten_properties(data, target, parent_key="", top_level=False):
    for k, v in data.items():
        if top_level and (k == "bbox" or v is None):
            continue  # Skip "bbox" keys and None values in top-level
        elif isinstance(v, dict):
            new_parent_key = f"{parent_key}.{k}" if parent_key else k
            flatten_properties(v, target, new_parent_key, top_level=False)
        else:
            key = f"{parent_key}.{k}" if parent_key else k
            target[key] = v


def convert_batch(batch):
    features = []
    for row in batch.to_pylist():
        geometry = shapely.wkb.loads(row.pop("geometry"))
        row.pop("bbox", None)  # Remove bbox column if present
        properties = {}
        flatten_properties(row, properties, top_level=True)
        features.append(
            {
                "type": "Feature",
                "geometry": geometry.__geo_interface__,
                "properties": properties,
            }
        )
    return features


def get_writer(output_format, path):
    if output_format == "geojson":
        return GeoJSONWriter(path)
    elif output_format == "geojsonseq":
        return GeoJSONSeqWriter(path)


class BaseGeoJSONWriter:
    def __init__(self, path):
        self.file_handle = open(os.path.expanduser(path), "w")
        self.writer = self.file_handle
        self.is_open = True

    def __enter__(self):
        return self

    def __exit__(self, exc_type, value, traceback):
        self.close()

    def close(self):
        if self.is_open:
            self.finalize()
            self.file_handle.close()
            self.is_open = False

    def write_batch(self, batch):
        for feature in batch:
            self.write_feature(feature)

    def write_feature(self, feature):
        pass

    def finalize(self):
        pass


class GeoJSONSeqWriter(BaseGeoJSONWriter):
    def write_feature(self, feature):
        self.writer.write(json.dumps(feature, separators=(",", ":")))
        self.writer.write("\n")


class GeoJSONWriter(BaseGeoJSONWriter):
    def __init__(self, path):
        super().__init__(path)
        self._has_written_feature = False
        self.writer.write('{"type": "FeatureCollection", "features": [\n')

    def write_feature(self, feature):
        if self._has_written_feature:
            self.writer.write(",\n")
        self.writer.write(json.dumps(feature, separators=(",", ":")))
        self._has_written_feature = True

    def finalize(self):
        self.writer.write("]}\n")


if __name__ == "__main__":
    convert()
