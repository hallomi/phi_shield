# phi_shield

A comprehensive PHI (Protected Health Information) monitoring and compliance system that ensures patient data is properly handled, logged, and redacted before frontend display. This system leverages Pathway as a real-time streaming engine, Aparavi for advanced PHI detection and compliance tracking, and Gemini LLM for risk severity analysis.

## System Purpose

phi_shield is designed to:
- Monitor and intercept all LLM queries and responses in real-time
- Detect, classify, and categorize PHI (patient names, medical record numbers, SSNs, dates, etc.)
- Redact sensitive patient data before logging and frontend display
- Analyze risk severity based on PHI type, userID, and patientID
- Maintain audit trails of all PHI accessed and LLM interactions
- Ensure HIPAA compliance through comprehensive logging and monitoring

## Architecture Overview

The system consists of three main components:

1. **Backend (Pathway)** — Real-time streaming pipeline that ingests patient data, triggers LLM processing via Gemini, and initiates PHI compliance workflows
2. **Aparavi PHI Monitoring Pipeline** — Advanced workflow that detects, classifies, anonymizes PHI, analyzes risk severity, and maintains compliance audit logs
3. **Frontend** — Dashboard for viewing anonymized data and compliance reports

### Data Flow

```
Pathway (Streaming Backend + LLM Post-Processor)
    ↓
Gemini LLM Response (with patient context)
    ↓
Pathway sends response to:
  a) Frontend (real-time display)
  b) Webhook trigger → Aparavi Pipeline
    ↓
Aparavi PHI Monitoring Workflow:
  1. Web Hook (Input: LLM response, userID, patientID, query)
  2. Text - Classification (Categorize PHI types)
  3. Text - Anonymize (Redact PHI with #)
  4. Preprocessor - General Text (Tokenization & normalization)
  5. Embedding - Transformer (Create vector embeddings)
  6. LLM - Gemini (Analyze risk severity based on PHI type & IDs)
  7. Vector Store - Odrant (Store embeddings & audit logs for compliance)
    ↓
HTTP Results (JSON Response) → Frontend Dashboard + Database Logging
```

## Directory Structure

- `Backend/`
  - `main.py` — Pathway streaming pipeline. Watches `./health_input/` for CSV files, processes patient data, triggers Gemini LLM, and sends results to Aparavi webhook.
- `Frontend/`
  - Static HTML/TS/JS files displaying anonymized PHI data and compliance dashboards.
- `Aparavi/`
  - Configuration files and pipeline definitions for PHI detection and compliance workflows.

## Backend (Pathway) — What It Does

Key behavior in `Backend/main.py`:

- **Data Ingestion**: Watches `./health_input/` for CSV files with schema `patient_id,context` and ingests them in real-time using Pathway's streaming mode.
- **LLM Processing**: Sends patient context through Gemini LLM (via Pathway's post-processor) to generate clinical summaries, recommendations, or responses.
- **Real-time Callbacks**: Prints live updates as new notes are ingested and processed.
- **Aparavi Webhook Trigger**: Upon LLM response completion, triggers the Aparavi PHI monitoring pipeline via webhook, sending:
  - LLM response (the output from Gemini)
  - userID (accessing user)
  - patientID (patient being queried)
  - Original query
- **Audit Logging**: Writes stream to `patient_notes_stream.jsonl` for offline inspection and compliance audits.

Pathway's `pw.run()` starts the streaming event loop. KeyboardInterrupt stops it gracefully.

## Aparavi PHI Monitoring Pipeline — Detailed Workflow

The Aparavi workflow is triggered by the Pathway webhook and performs the following steps:

### 1. **Web Hook (Entry Point)**
- Receives LLM response, userID, patientID, and original query from Pathway
- Acts as the ingestion point for all PHI monitoring

### 2. **Text - Classification**
- **Purpose**: Identify and categorize PHI types within the LLM response
- **Output**: Tagged classifications for each PHI element (e.g., `[PATIENT_NAME]`, `[MRN]`, `[SSN]`, `[DATE_OF_BIRTH]`, `[MEDICAL_RECORD_NUMBER]`)
- **Significance**: Enables granular understanding of what sensitive data is present

### 3. **Text - Anonymize**
- **Purpose**: Redact all identified PHI by replacing with `#` character
- **Example**: "John Smith has MRN 123456" → "# has MRN #"
- **Output**: Fully anonymized text safe for logging and frontend display
- **Significance**: Ensures no unredacted PHI is stored in logs or displayed to users

### 4. **Preprocessor - General Text**
- **Purpose**: Prepare anonymized text for embedding and analysis
- **Operations**: Tokenization, normalization, cleaning
- **Output**: Preprocessed text ready for vector embedding
- **Significance**: Ensures consistent text processing for downstream components

### 5. **Embedding - Transformer**
- **Purpose**: Convert preprocessed text into high-dimensional vector embeddings
- **Technology**: Transformer-based embeddings for semantic understanding
- **Output**: Vector representation of the anonymized text
- **Significance**: Enables similarity search and pattern detection for future queries

### 6. **LLM - Gemini (Risk Severity Analysis)**
- **Purpose**: Analyze and score the risk severity of PHI exposure
- **Inputs**: 
  - PHI type categories (from Classification)
  - userID (who accessed the data)
  - patientID (whose data was accessed)
  - Original query context
- **Analysis**: Gemini LLM evaluates:
  - Type of PHI exposed (e.g., SSN is high-risk, date is low-risk)
  - User authorization level (based on userID)
  - Patient sensitivity profile (based on patientID)
  - Query context and purpose
- **Output**: Risk severity score (e.g., LOW, MEDIUM, HIGH, CRITICAL)
- **Significance**: Enables compliance teams to identify and respond to high-risk PHI exposures

### 7. **Vector Store - Odrant**
- **Purpose**: Store embeddings and maintain audit logs for compliance
- **Data Stored**:
  - Vector embeddings (for similarity search across queries)
  - Query logs with severity analysis
  - Anonymized context and classifications
  - Metadata: userID, patientID, timestamp, risk score
- **Use Cases**:
  - Detect similar PHI exposure patterns
  - Identify trends in data access
  - Support similarity-based anomaly detection
  - Enable compliance audits and forensic analysis
- **Significance**: Builds a searchable, historical record of all PHI interactions for compliance and security analysis

### 8. **HTTP Results (Output)**
- **Purpose**: Generate final JSON response for frontend and database storage
- **Output Schema**:
  ```json
  {
    "status": "success/error",
    "original_query": "...",
    "user_id": "...",
    "patient_id": "...",
    "llm_response_anonymized": "# has MRN #...",
    "phi_classifications": [
      {"type": "PATIENT_NAME", "confidence": 0.99},
      {"type": "MRN", "confidence": 0.98}
    ],
    "risk_severity": "HIGH",
    "risk_analysis": "SSN and patient name exposed; high-risk user access",
    "vector_id": "...",
    "timestamp": "...",
    "audit_metadata": {...}
  }
  ```
- **Delivery**:
  - Frontend dashboard (displays anonymized results and risk scores)
  - Database logging (maintains compliance audit trail)
- **Significance**: Ensures all PHI interactions are logged, analyzed, and traceable for compliance and security

## Backend — Quick Setup and Run (Windows, cmd.exe)

Prerequisites:

- Python 3.8+ (recommended). A virtual environment is advised.
- Pathway library for streaming pipelines
- Access to Gemini LLM (via API key)
- Aparavi webhook endpoint credentials (Webhook Interface URL, Public Authorization Key, Private Token)
- Odrant vector database instance

Installation:

```cmd
# create and activate a venv (Windows cmd)
python -m venv .venv
.venv\Scripts\activate

pip install --upgrade pip
pip install pathway rich google-generativeai

# Configure environment variables
set GEMINI_API_KEY=your-api-key
set APARAVI_WEBHOOK_URL=https://eaas-stg.aparavi.com/webhook
set APARAVI_PUBLIC_AUTH_KEY=your-public-key
set APARAVI_PRIVATE_TOKEN=your-private-token
set ODRANT_HOST=your-odrant-instance
set ODRANT_PORT=6333

# run the streaming backend
python Backend\main.py
```

What you should see:

- Console instructions describing `./health_input/` and streaming readiness
- When new patient data arrives or LLM processing completes:
  - Console prints live updates (query, LLM response, webhook trigger confirmation)
  - Aparavi webhook processes the response and returns risk analysis
  - `patient_notes_stream.jsonl` logs all interactions (with PHI redacted)
  - Vector store indexes the interaction for future analysis

Example CSV row (append to `health_input/patient_notes.csv`):

```csv
12345,"Patient John Smith reports chest pain, MRN is 987654"
```

Expected flow:
1. Pathway ingests the row
2. Pathway sends to Gemini LLM for analysis
3. Gemini returns clinical summary
4. Pathway triggers Aparavi webhook with response + userID + patientID
5. Aparavi classifies PHI (PATIENT_NAME, MRN), redacts to "Patient # reports chest pain, MRN is #"
6. Gemini LLM analyzes risk as HIGH (PHI exposure detected)
7. Odrant stores embeddings and audit log
8. HTTP results returned to frontend and database

## Frontend — Run / Test

The `Frontend/` folder contains static HTML, JS and TypeScript files. It displays:
- Anonymized patient query results
- Risk severity indicators
- PHI exposure summaries
- Compliance audit logs

To run:

```cmd
# from the Frontend folder
cd Frontend
npm install
npx serve -s .  # serves on a local port (typically http://localhost:3000)
```

Or simply open `Frontend\index.html` in your browser for a quick local check.

## Aparavi Integration Details

### Authentication & Configuration

To test and deploy the Aparavi PHI monitoring pipeline:

1. **Webhook Endpoint**: `https://eaas-stg.aparavi.com/webhook`
2. **Authentication Methods**:
   - **Authorization Header**: Use your Public Authorization Key
   - **Query Parameter**: Optionally include Private Token for additional security
3. **Request Format**:
   ```
   Method: PUT
   URL: https://eaas-stg.aparavi.com/webhook?token=<task-token>
   Headers:
     Authorization: <Public Authorization Key>
     X-Private-Token: <Private Token> (optional)
     Content-Type: multipart/form-data
   ```

### Workflow Components Configuration

Each Aparavi workflow component can be customized:

- **Text - Classification**: Configure PHI categories (names, MRNs, SSNs, dates, medical record numbers, etc.)
- **Text - Anonymize**: Set redaction character (currently `#`) and strategy
- **Preprocessor**: Configure tokenization rules and normalization
- **LLM - Gemini**: Fine-tune risk severity prompts and scoring rubrics
- **Vector Store - Odrant**: Configure similarity search thresholds and retention policies

### Testing Aparavi Integration

To test the webhook in Postman:

1. Start a task with Pathway to get a task token
2. Send a PUT request to the webhook with:
   - Task token in query parameters
   - LLM response in request body
   - Proper authorization headers
3. Expect a JSON response with classifications, anonymized text, and risk analysis

## Data Contract

- **Input** (from Pathway):
  - LLM response (text)
  - userID (accessing user identifier)
  - patientID (patient identifier)
  - Original query
- **Processing**:
  - PHI detection and categorization
  - Text anonymization with `#` redaction
  - Risk severity analysis
  - Vector embedding and storage
- **Output**:
  - Anonymized text for logging and display
  - Risk severity score
  - PHI classifications
  - Audit metadata
  - Vector ID for similarity searches

## Compliance & Security Considerations

1. **PHI Redaction**: All patient PHI is redacted with `#` before any logging or frontend display
2. **Audit Logging**: Every PHI access is logged with userID, patientID, timestamp, and risk analysis
3. **Risk Analysis**: Risk severity is computed for each interaction based on PHI type and access context
4. **Vector Storage**: Embeddings enable historical pattern analysis and anomaly detection
5. **Access Control**: Ensure Aparavi webhook credentials are stored securely (environment variables, secrets manager)
6. **Retention Policies**: Configure Odrant retention to comply with HIPAA data retention requirements

## Edge Cases & Error Handling

- **Malformed LLM Responses**: Pathway validates responses before sending to Aparavi
- **PHI Detection Failures**: Aparavi classifications may miss some PHI; configure sensitivity thresholds
- **Network Timeouts**: Implement retry logic with exponential backoff for webhook calls
- **Large Responses**: Aparavi handles streaming; ensure embedding service has sufficient capacity
- **Vector Store Full**: Monitor Odrant capacity; implement cleanup policies for old embeddings

## Extending the System

### Adding New PHI Categories

Update the Aparavi Text - Classification component to recognize additional PHI types (insurance IDs, phone numbers, email addresses, etc.).

### Custom Risk Scoring

Modify the Gemini LLM prompts in the Risk Analysis component to incorporate custom business logic or compliance requirements.

### Integration with External Systems

Use the HTTP Results output to integrate with:
- SIEM systems for security monitoring
- Compliance dashboards for reporting
- Alert systems for high-risk exposures
- Data warehouses for long-term analysis

## Logging and Monitoring

The system uses multiple logging layers:

- **Console Output**: Real-time feedback on Pathway ingestion and webhook triggers
- **JSONL Logs**: `patient_notes_stream.jsonl` stores all interactions (with PHI redacted)
- **Vector Store Logs**: Odrant maintains searchable audit trails
- **Aparavi Logs**: Monitoring and classification details within Aparavi platform
- **Frontend Dashboard**: User-facing view of anonymized data and risk indicators

For production deployment, integrate with:
- Python `logging` framework for structured logs
- Prometheus or similar for metrics (query count, risk distribution, etc.)
- Centralized log aggregation (ELK, Splunk, CloudWatch)
- Alerting on high-risk PHI exposures

## Troubleshooting

### Aparavi Webhook Returns "Task token is required"

Ensure you're including the `?token=<task-token>` query parameter in the webhook URL. The token comes from initializing the Aparavi task, not from your stored credentials.

### PHI Not Being Redacted

Check that the Text - Classification component is correctly identifying the PHI types. Adjust sensitivity thresholds if needed.

### Risk Severity Always "LOW"

Review the Gemini LLM prompts in the Risk Analysis component. Ensure the risk scoring logic aligns with your compliance requirements.

### Vector Store Not Responding

Verify Odrant instance is running and accessible. Check network connectivity and authentication to the vector store.

## References

- [Pathway Documentation](https://pathway.com)
- [Google Gemini API](https://ai.google.dev/)
- [Aparavi Data Toolchain for AI](https://aparavi.com/documentation-aparavi/)
- [Odrant Vector Database](https://qdrant.tech/)
- [HIPAA Compliance Guidelines](https://www.hhs.gov/hipaa/)


