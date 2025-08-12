from flask import Blueprint, jsonify, request
import google.generativeai as genai
import os
import PyPDF2
from io import BytesIO
from dotenv import load_dotenv
from uuid import uuid4
from pdfminer.high_level import extract_text as pdfminer_extract_text

load_dotenv()
key = os.getenv("GEMINI_API_KEY")
if not key:
    raise RuntimeError("GEMINI_API_KEY not set")
genai.configure(api_key=key)
model = genai.GenerativeModel(
    'gemini-2.5-flash',
    system_instruction=(
        "You are a professional chatbot. Always answer in clean Markdown with:\n"
        "- short title line\n- bullet points\n- bold keywords\n"
        "- tables when comparing items\n- code blocks for code."
    ),
)

chat_bp = Blueprint('chat', __name__)

# Hold PDF text by id (simple in-memory cache for this assignment)
PDF_STORE = {}  # { pdf_id: "full text ..." }

def extract_pdf_text(file_storage):
    """Extract text and page count from an uploaded PDF file."""
    pdf_bytes = file_storage.read()
    text = ""
    pages = 0
    try:
        reader = PyPDF2.PdfReader(BytesIO(pdf_bytes))
        pages = len(reader.pages)
        parts = []
        for p in reader.pages:
            try:
                parts.append(p.extract_text() or "")
            except Exception:
                parts.append("")
        text = "\n\n".join(parts).strip()
    except Exception:
        pass
    if not text:
        try:
            text = pdfminer_extract_text(BytesIO(pdf_bytes)).strip()
        except Exception:
            text = ""
    return text, pages

@chat_bp.route("/upload-pdf", methods=["POST"])
def upload_pdf():
    f = request.files.get("file")
    if not f:
        return jsonify({"error": "No file uploaded"}), 400

    text, pages = extract_pdf_text(f)
    if not text:
        return jsonify({"error": "Could not extract text from PDF"}), 400

    pdf_id = str(uuid4())
    PDF_STORE[pdf_id] = text

    preview = (text[:200] + "...") if len(text) > 200 else text
    return jsonify({
        "message": "PDF uploaded successfully",
        "pdf_id": pdf_id,
        "pages": pages,
        "preview": preview
    })

@chat_bp.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True)
    user_msg = (data.get("message") or "").strip()
    pdf_id = data.get("pdf_id")  # <-- FE sends this ONLY when using the PDF
    pdf_text = PDF_STORE.get(pdf_id)

    if pdf_id and pdf_text is None:
        return jsonify({"reply": "PDF context not found. Please re-upload the document.", "hasPdfContext": False})

    if pdf_text == "":
        return jsonify({"reply": "I couldn't extract any text from the PDF. Make sure it contains selectable text.", "hasPdfContext": False})

    if pdf_text:
        prompt = (
            "You are a professional chatbot. Answer in clean Markdown. "
            "Use ONLY the document when relevant.\n\n"
            f"--- DOCUMENT START ---\n{pdf_text}\n--- DOCUMENT END ---\n\n"
            f"User: {user_msg}"
        )
    else:
        prompt = f"You are a professional chatbot. Answer in clean Markdown.\n\nUser: {user_msg}"

    resp = model.generate_content(prompt)

    # defensive extraction (handles empty/blocked responses)
    reply = getattr(resp, "text", "") or ""
    if not reply and getattr(resp, "candidates", None):
        chunks = []
        for c in resp.candidates:
            content = getattr(c, "content", None)
            for part in getattr(content, "parts", []) if content else []:
                if getattr(part, "text", None):
                    chunks.append(part.text)
        reply = "\n".join(chunks)

    return jsonify({"reply": reply or "Sorry, I couldn’t generate a response.", "hasPdfContext": bool(pdf_text)})

@chat_bp.route("/clear-pdf", methods=["POST"])
def clear_pdf():
    """Optional: clear a specific pdf_id if the FE sends one."""
    pdf_id = (request.get_json() or {}).get("pdf_id")
    if pdf_id and pdf_id in PDF_STORE:
        del PDF_STORE[pdf_id]
    return jsonify({"message": "OK"})
