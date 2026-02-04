#!/usr/bin/env python3
"""Import event data from Excel file into SQLite database."""

import sqlite3
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from pathlib import Path

EXCEL_FILE = Path.home() / "Downloads" / "Events_option3_FINAL.xlsm"
DB_FILE = Path(__file__).parent / "cookies.db"

def excel_date_to_iso(serial):
    """Convert Excel date serial number to ISO date string."""
    if not serial or serial == '':
        return None
    try:
        serial = float(serial)
        # Excel dates start from 1900-01-01, but Excel incorrectly thinks 1900 was a leap year
        # So we use 1899-12-30 as the base date
        base = datetime(1899, 12, 30)
        return (base + timedelta(days=serial)).strftime('%Y-%m-%d')
    except (ValueError, TypeError):
        return None

def parse_number(value, is_int=False):
    """Parse a number from Excel, handling empty strings."""
    if value is None or value == '' or value == 'None':
        return 0
    try:
        num = float(value)
        return int(num) if is_int else round(num, 2)
    except (ValueError, TypeError):
        return 0

def read_excel_sheets(xlsx_path):
    """Read all sheets from an Excel file using zipfile + XML parsing."""
    sheets = {}
    shared_strings = []

    with zipfile.ZipFile(xlsx_path, 'r') as z:
        # Read shared strings
        try:
            with z.open('xl/sharedStrings.xml') as f:
                tree = ET.parse(f)
                root = tree.getroot()
                ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
                for si in root.findall('.//main:si', ns):
                    text_parts = []
                    for t in si.findall('.//main:t', ns):
                        if t.text:
                            text_parts.append(t.text)
                    shared_strings.append(''.join(text_parts))
        except KeyError:
            pass

        # Read workbook to get sheet names
        with z.open('xl/workbook.xml') as f:
            tree = ET.parse(f)
            root = tree.getroot()
            ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            sheet_names = []
            for sheet in root.findall('.//main:sheet', ns):
                sheet_names.append(sheet.get('name'))

        # Read each sheet
        for i, sheet_name in enumerate(sheet_names):
            sheet_file = f'xl/worksheets/sheet{i + 1}.xml'
            try:
                with z.open(sheet_file) as f:
                    tree = ET.parse(f)
                    root = tree.getroot()
                    ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

                    rows = []
                    for row in root.findall('.//main:row', ns):
                        cells = []
                        for cell in row.findall('.//main:c', ns):
                            cell_type = cell.get('t')
                            value_elem = cell.find('main:v', ns)
                            value = value_elem.text if value_elem is not None else ''

                            if cell_type == 's' and value:
                                # Shared string reference
                                try:
                                    value = shared_strings[int(value)]
                                except (IndexError, ValueError):
                                    pass

                            cells.append(value)
                        if cells:
                            rows.append(cells)

                    sheets[sheet_name] = rows
            except KeyError:
                pass

    return sheets

def import_data():
    """Import all event data from Excel into SQLite."""
    print(f"Reading Excel file: {EXCEL_FILE}")
    sheets = read_excel_sheets(EXCEL_FILE)

    print(f"Found sheets: {list(sheets.keys())}")

    # Connect to database
    print(f"Connecting to database: {DB_FILE}")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Clear existing data
    print("Clearing existing events and event_items...")
    cursor.execute("DELETE FROM event_items")
    cursor.execute("DELETE FROM events")
    conn.commit()

    # Get Events_DB sheet
    events_db = sheets.get('Events_DB', [])
    if not events_db:
        print("ERROR: Events_DB sheet not found!")
        return

    # Skip header row
    events_data = events_db[1:]

    print(f"\nImporting {len(events_data)} events...")

    # Map worksheet names to event IDs
    event_id_map = {}

    for row in events_data:
        if len(row) < 11:
            row.extend([''] * (11 - len(row)))

        event_id_excel, worksheet, event_name, event_date, total_prepared, total_sold, total_giveaway, total_revenue, total_cost, net_profit, notes = row[:11]

        # Skip empty rows (no event name or worksheet)
        if not event_name or event_name.strip() == '' or not worksheet or worksheet.strip() == '':
            continue

        # Convert Excel date
        iso_date = excel_date_to_iso(event_date)
        if not iso_date:
            iso_date = '2024-01-01'  # Default date if conversion fails

        # Insert event
        cursor.execute("""
            INSERT INTO events (name, event_date, total_prepared, total_sold, total_giveaway,
                               total_revenue, total_cost, net_profit, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            event_name,
            iso_date,
            parse_number(total_prepared, is_int=True),
            parse_number(total_sold, is_int=True),
            parse_number(total_giveaway, is_int=True),
            parse_number(total_revenue),
            parse_number(total_cost),
            parse_number(net_profit),
            notes if notes else None
        ))

        db_event_id = cursor.lastrowid
        event_id_map[worksheet] = db_event_id
        print(f"  Created event '{event_name}' (ID: {db_event_id}) -> worksheet '{worksheet}'")

    conn.commit()

    # Now import items for each event from their respective worksheets
    print("\nImporting event items...")

    for worksheet_name, db_event_id in event_id_map.items():
        sheet_data = sheets.get(worksheet_name, [])
        if not sheet_data:
            print(f"  WARNING: Worksheet '{worksheet_name}' not found, skipping...")
            continue

        # Skip header row
        items_data = sheet_data[1:]
        items_count = 0

        for row in items_data:
            if len(row) < 9:
                row.extend([''] * (9 - len(row)))

            product, prepared, remaining, giveaway, sold, revenue, unit_cost, cogs, profit = row[:9]

            # Skip empty rows
            if not product or product.strip() == '':
                continue

            cursor.execute("""
                INSERT INTO event_items (event_id, flavor_name, prepared, remaining, giveaway,
                                        sold, revenue, unit_cost, cogs, profit)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                db_event_id,
                product.strip(),
                parse_number(prepared, is_int=True),
                parse_number(remaining, is_int=True),
                parse_number(giveaway, is_int=True),
                parse_number(sold, is_int=True),
                parse_number(revenue),
                parse_number(unit_cost),
                parse_number(cogs),
                parse_number(profit)
            ))
            items_count += 1

        print(f"  Imported {items_count} items for worksheet '{worksheet_name}'")

    conn.commit()

    # Verify import
    cursor.execute("SELECT COUNT(*) FROM events")
    event_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM event_items")
    item_count = cursor.fetchone()[0]

    print(f"\n=== Import Complete ===")
    print(f"Total events: {event_count}")
    print(f"Total event items: {item_count}")

    # Show summary
    print("\nEvent Summary:")
    cursor.execute("""
        SELECT e.id, e.name, e.event_date,
               (SELECT COUNT(*) FROM event_items WHERE event_id = e.id) as item_count
        FROM events e
        ORDER BY e.event_date
    """)
    for row in cursor.fetchall():
        print(f"  ID {row[0]}: {row[1]} ({row[2]}) - {row[3]} items")

    conn.close()

if __name__ == '__main__':
    import_data()
