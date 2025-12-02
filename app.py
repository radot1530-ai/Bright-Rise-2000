from flask import Flask, render_template, request, jsonify
import json, os

app = Flask(__name__)

ANNONCES_FILE = "annonces.json"
DEMANDES_FILE = "demandes.json"

# ---------- Fonksyon util ----------
def load_json(file):
    if not os.path.exists(file): return []
    with open(file, "r", encoding="utf-8") as f: return json.load(f)

def save_json(file, data):
    with open(file, "w", encoding="utf-8") as f: json.dump(data, f, ensure_ascii=False, indent=2)

# ---------- Paj index ----------
@app.route("/")
def index():
    return render_template("index.html")

# ---------- Paj admin ----------
@app.route("/admin")
def admin():
    return render_template("admin.html")

# ---------- API pou anons ----------
@app.route("/get_annonces")
def get_annonces():
    return jsonify(load_json(ANNONCES_FILE))

@app.route("/add_annonce", methods=["POST"])
def add_annonce():
    data = request.form.to_dict()
    annonces = load_json(ANNONCES_FILE)
    annonces.append(data)
    save_json(ANNONCES_FILE, annonces)
    return jsonify({"success": True})

# ---------- API pou demann kliyan ----------
@app.route("/add_demande", methods=["POST"])
def add_demande():
    data = request.form.to_dict()
    demandes = load_json(DEMANDES_FILE)
    demandes.append(data)
    save_json(DEMANDES_FILE, demandes)
    return jsonify({"success": True})

@app.route("/get_demandes")
def get_demandes():
    return jsonify(load_json(DEMANDES_FILE))

if __name__ == "__main__":
    app.run(debug=True)