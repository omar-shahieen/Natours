#!/bin/bash

# Function to recursively find and modify import statements
convert_imports() {
  local dir="$1"

  # 1. Process all .ts files in the current directory
  # The 'sed' command looks for:
  # - (import...from '...')
  # - ends with .js followed by a quote (' or ")
  # and replaces it with .ts
  find "$dir" -maxdepth 1 -type f -name "*.ts" -exec sed -i -e "s/\(\(import\|export\).*\)\.js\(['\"]\)/\1.ts\3/g" {} \;

  echo "Processed .ts files in: $dir"

  # 2. Recursively process subdirectories, excluding node_modules
  for subdir in "$dir"/*; do
    if [ -d "$subdir" ] && [ "${subdir##*/}" != "node_modules" ]; then
      convert_imports "$subdir"
    fi
  done
}

# --- Main Script Execution ---

# Check if a directory is provided as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 <directory>"
  exit 1
fi

# Check if the provided path is a directory
if [ ! -d "$1" ]; then
  echo "Error: '$1' is not a directory."
  exit 1
fi

echo "Starting import conversion in directory: $1"

# Call the function to convert imports
convert_imports "$1"

echo "Import conversion complete. Review all changes carefully."