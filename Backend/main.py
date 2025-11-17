import pathway as pw
import os
from pathway import llms

from rich import console

# Make sure the input directory exists
os.makedirs("./health_input/", exist_ok=True)

# ==== 1. Define schema for your new data ====
# Two fields only: patient_id and context
class PatientNotes(pw.Schema):
    patient_id: str = pw.column_definition()
    context: str = pw.column_definition()


input_table = pw.io.csv.read(
    "./health_input/",
    schema=PatientNotes,
    mode="streaming",
    autocommit_duration_ms=500,  # check for changes every 500ms
)

# ==== 3. (Optional) simple stats: how many notes so far ====
stats_table = input_table.reduce(
    total_notes=pw.reducers.count(),
)

# ==== 4. Just echo each new note as it arrives ====
notes_table = input_table.select(
    pw.this.patient_id,
    pw.this.context,
)

# ==== 5. Write stream to a JSONL file for inspection ====
pw.io.jsonlines.write(notes_table, "patient_notes_stream.jsonl")

# ==== 6. Callbacks to print updates in real time ====
def on_stats_update(key, row, time, is_addition):
    print("hey what is happening")
    if is_addition:
        print("\n" + "="*60)
        print("📊 PATIENT NOTES STATS UPDATED")
        print("="*60)
        print(f"Total notes ingested so far: {row['total_notes']}")
        print("="*60 + "\n")

def on_note_update(key, row, time, is_addition):
    if is_addition:
        print("\n🆕 New patient note received:")
        print(f"  👤 Patient ID: {row['patient_id']}")
        print(f"  📝 Context   : {row['context']}\n")

# Subscribe to live updates
pw.io.subscribe(stats_table, on_stats_update)
pw.io.subscribe(notes_table, on_note_update)

# ==== 7. Helper: show instructions ====
def print_instructions():
    print("\n" + "="*70)
    print("🏥 REAL-TIME PATIENT NOTES STREAM (Pathway)")
    print("="*70)
    print("\nWatching directory: ./health_input/")
    print("Any *.csv file here will be ingested in STREAMING mode.\n")
    print("CSV header (MUST be first line):")
    print("patient_id,context")
    print("\nExample row:")
    print('12345,"Patient reports mild chest pain for 2 days, no fever."\n')
    print("You can:")
    print("  • Append new rows to an existing CSV file (e.g., notes.csv)")
    print("  • OR create new CSV files (notes2.csv, notes3.csv, ...)")
    print("\nPathway will detect BOTH new files and new rows.")
    print("="*70 + "\n")

    # Create a starter CSV if none exists
    csv_path = "./health_input/patient_notes.csv"
    if not os.path.exists(csv_path):
        with open(csv_path, "w") as f:
            f.write("patient_id,context\n")
        print(f"✓ Created starter file: {csv_path}")
        print('  You can now append rows like:')
        print('  echo \'12345,"First visit, general checkup"\' >> health_input/patient_notes.csv\n')

# ==== 8. Run ====
print_instructions()

try:
    pw.run()
except KeyboardInterrupt:
    print("\n\n✓ Streaming stopped by user.")
except Exception as e:
    print(f"\n\n❌ Error: {e}")