# The Financial Wellness Checker

A web application that turns federal survey data into a personalized financial 
risk score. Built as a final project for Advanced Programming (16:958:589:01) 
at Rutgers University, Spring 2026.

Live app: https://financial-wellness.up.railway.app/

---

## What It Does

Most people have no way to objectively assess their financial health. This tool 
scores users across four dimensions (Banking Access, Emergency Preparedness, 
Spending Behavior, and Financial Literacy) based on answers to nine questions 
about their real financial habits. Every scoring weight is derived from 
statistically validated findings from SHED 2023, DCPC 2024, and CEX 2023 
federal survey data.

The output is a risk score, a per-dimension breakdown, and a personalized 
action plan with prioritized recommendations tailored to the user's answers.

---

## Tech Stack

- Python 3.10+
- Flask
- SQLAlchemy
- PostgreSQL (Railway) / SQLite (local)
- Jinja2
- Vanilla JavaScript (Before/After Simulator)
- Deployed on Railway

---

## Local Setup

1. Clone the repository
2. Create and activate a virtual environment
   python -m venv venv
   source venv/bin/activate
3. Install dependencies
   pip install -r requirements.txt
4. Copy the example environment file and fill in your values
   cp .env.example .env
5. Run the app
   python app.py

The app will be available at http://localhost:5000

For local testing without a database, set DATABASE_URL in .env to a SQLite 
path and the app will use that instead of PostgreSQL.

---

## Project Structure

app.py               Flask routes for all pages
models.py            SQLAlchemy models (User, AssessmentResponse, ActionPlanItem)
scoring.py           Scoring engine; all weights traced back to federal findings
recommendations.py   Action plan generator; context-aware recommendation logic
templates/           Jinja2 HTML templates (base.html + per-page templates)
static/              CSS and JavaScript (includes Before/After Simulator logic)
notebooks/           Original analysis notebooks used to derive scoring weights
  cex_analysis.ipynb
  dcpc_analysis.ipynb
  shed_analysis.ipynb
  statistical_analysis.ipynb

---

## Data Sources

SHED 2023   Survey of Household Economics and Decisionmaking (11,400 U.S. adults)
DCPC 2024   Diary of Consumer Payment Choice (28,515 transactions, 3,500 consumers)
CEX 2023    Consumer Expenditure Survey (~30,000 households)

The notebooks document the full path from raw data through statistical testing 
to the benchmark values embedded in scoring.py.

---

## Authors

Sanjitha Rajesh (sr2113)
Siritha Chidipothu (sc2855)
