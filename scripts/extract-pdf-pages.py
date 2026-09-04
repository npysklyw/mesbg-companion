import json
import sys
from pypdf import PdfReader

reader = PdfReader(sys.argv[1])
json.dump([page.extract_text() or "" for page in reader.pages], sys.stdout)
