from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from hashlib import sha256
from pathlib import Path
from zipfile import ZipFile, BadZipFile
from io import BytesIO
import os

app = FastAPI(title="VeriFix API", version="0.1.0")

# Development only. Restrict this to your deployed frontend origin in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("FRONTEND_ORIGIN", "http://localhost:3000").split(",") if origin.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

MAX_BYTES = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".docx"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "VeriFix API"}

@app.post("/api/verify")
async def verify_document(file: UploadFile = File(...)):
    filename = Path(file.filename or "upload").name
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")

    content = await file.read(MAX_BYTES + 1)
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(content) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File is larger than the 10 MB limit.")

    checks = []
    if extension == ".pdf":
        signature_ok = content.startswith(b"%PDF-")
        checks.append({
            "name": "PDF signature",
            "status": "passed" if signature_ok else "failed",
            "details": "The file begins with a PDF signature." if signature_ok else "The file extension is PDF, but the expected PDF signature was not found."
        })
    else:
        try:
            with ZipFile(BytesIO(content)) as archive:
                names = set(archive.namelist())
                signature_ok = "[Content_Types].xml" in names and "word/document.xml" in names
        except BadZipFile:
            signature_ok = False
        checks.append({
            "name": "DOCX structure",
            "status": "passed" if signature_ok else "failed",
            "details": "The ZIP container contains expected Word document entries." if signature_ok else "The file does not appear to have a valid DOCX container structure."
        })

    digest = sha256(content).hexdigest()
    checks.append({
        "name": "SHA-256 fingerprint",
        "status": "info",
        "details": "A fingerprint was calculated. It can help compare this file with another copy, but it does not establish authenticity."
    })

    overall = "format checks passed" if signature_ok else "format check failed"
    return {
        "filename": filename,
        "size_bytes": len(content),
        "sha256": digest,
        "overall": overall,
        "checks": checks,
        "limitations": [
            "This report checks basic file format only.",
            "It does not prove who issued the document or whether its contents are true.",
            "No uploaded file is saved permanently by this prototype."
        ]
    }
