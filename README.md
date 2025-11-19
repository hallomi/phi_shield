# phi_shield

A comprehensive PHI (Protected Health Information) monitoring and compliance system that ensures patient data is up to date, properly handled, and logs from LLM calls are redacted before storing. This system leverages Pathway as a real-time streaming and monitoring engine with dynamic context updating for LLMs, Aparavi for advanced PHI detection, redaction, and compliance tracking, and Gemini LLM for risk severity analysis from the logs.

## System Purpose

phi_shield is designed to:
- Maintain real-time, up-to-date patient information through Pathway
- Dynamic context updating system for user queries 
- Monitor and intercept all LLM queries and responses in real-time
- Detect, classify, and categorize PHI (patient names, medical record numbers, SSNs, dates, etc.)
- Redact sensitive patient data from logs before storage
- Analyze risk severity based on PHI exposure patterns in historical logs
- Maintain audit trails of all PHI accessed and LLM interactions with full redaction
- Ensure HIPAA compliance through comprehensive logging and monitoring

## Architecture Overview

The system consists of three main components:

1. **Backend (Pathway)** — Real-time streaming and monitoring pipeline with dynamic context updating. Ingests patient data, maintains current context, processes LLM queries, and triggers PHI compliance workflows when LLM responses are generated.
2. **Aparavi PHI Monitoring Pipeline** — Advanced workflow that detects, classifies, and redacts PHI from LLM logs before they are stored. Produces anonymized logs safe for storage and analysis.
3. **Frontend** — Chatbot integrated with an existing EMR and a Dashboard for viewing anonymized data, compliance reports, and risk analysis based on historical log patterns.

### Data Flow

```
Patient Data Stream (Real-time)
    ↓
Pathway (Streaming + Context Updating Engine)
    ├─ Maintains current, up-to-date patient context
    ├─ Updates context dynamically as new information arrives
    └─ Routes to Gemini LLM for query processing
    ↓
Gemini LLM (Query Response Generation)
    ├─ Uses current patient context from Pathway
    └─ Returns clinical response/summary
    ↓
Pathway (Post-Processing)
    ├─ Sends response to Frontend (real-time display)
    └─ Triggers Aparavi Webhook with LLM logs for compliance processing
    ↓
Aparavi PHI Redaction & Compliance Workflow:
  1. Web Hook (Input: LLM response, userID, patientID, User query)
  2. Text - Classification (Categorize PHI types in logs)
  3. Text - Anonymize (Redact PHI with #)
  4. Preprocessor - General Text (Tokenization & normalization)
  5. Embedding - Transformer (Create vector embeddings of anonymized logs)
  6. Vector Store - Odrant (Store anonymized embeddings & audit logs)
    ↓
Gemini LLM (Risk Severity Analysis from Logs)
    ├─ Analyzes historical log patterns
    ├─ Evaluates PHI type, exposure frequency, user access patterns
    └─ Generates risk severity score
    ↓
HTTP Results (JSON with Redacted Logs) 
    ├─ Anonymized log entries
    ├─ Risk severity analysis
    └─ Store in Database + Display on Frontend Dashboard
```

## Directory Structure

- `Backend/`
  - `main.py` — Pathway streaming and context updating pipeline. Watches `./health_input/` for patient data, maintains current context, processes LLM queries via Gemini, and sends logs to Aparavi for redaction.
- `Frontend/`
  - Static HTML/TS/JS files displaying anonymized logs and compliance dashboards.
- `Aparavi/`
  - Configuration files and pipeline definitions for PHI detection, redaction, and compliance workflows.

## Backend (Pathway) — What It Does

Key behavior in `Backend/main.py`:

- **Real-time Data Ingestion**: Watches `./health_input/` for CSV files with schema `patient_id,context` and ingests them continuously using Pathway's streaming mode.
- **Dynamic Context Updating**: Maintains and updates patient context in real-time as new patient information arrives. This current context is available for LLM processing.
- **LLM Query Processing**: Routes patient queries and current context to Gemini LLM for clinical analysis, summaries, or responses.
- **Real-time Callbacks**: Prints live updates as new data arrives, context is updated, and LLM processing completes.
- **Dual Output on LLM Response**:
  - Sends response to **Frontend** for real-time user display
  - Triggers **Aparavi Webhook** with full LLM logs for PHI redaction and compliance processing
- **Log Payload to Aparavi**: Includes:
  - Full LLM response (with potential PHI)
  - Original patient query
  - userID (user who triggered the query)
  - patientID (patient data accessed)
  - Query timestamp and context metadata
- **Audit Logging**: Writes anonymized stream to `patient_notes_stream.jsonl` after redaction by Aparavi.

Pathway's `pw.run()` starts the streaming event loop. KeyboardInterrupt stops it gracefully.

**Key Advantage**: Pathway's real-time context updating ensures that LLMs always have the most current patient information, enabling more accurate clinical responses while maintaining a complete audit trail.

## Aparavi PHI Redaction & Compliance Pipeline — Detailed Workflow

The Aparavi workflow is triggered by the Pathway webhook when an LLM response is generated. It performs redaction of logs **before storage**, ensuring no unredacted PHI is ever persisted.

### 1. **Web Hook (Entry Point)**
- **Input**: LLM logs containing:
  - LLM response text (may contain PHI)
  - Original query
  - userID and patientID
  - Query timestamp
  - Context metadata
- **Role**: Ingestion point for all LLM logs requiring redaction before storage
- **Significance**: Ensures every LLM interaction is captured and processed for compliance

### 2. **Text - Classification**
- **Purpose**: Identify and categorize PHI types within the LLM logs
- **Analysis**: Scans both the query and response for sensitive data elements
- **Output**: Tagged classifications for each PHI element found:
  - `[PATIENT_NAME]` — Patient's full name or identifiers
  - `[MRN]` — Medical Record Number
  - `[SSN]` — Social Security Number
  - `[DATE_OF_BIRTH]` — Birth date or age identifiers
  - `[MEDICAL_RECORD_NUMBER]` — Additional medical identifiers
  - `[INSURANCE_ID]` — Insurance information
  - `[CONTACT_INFO]` — Phone numbers, email addresses, addresses
- **Confidence Scores**: Each classification includes confidence level for validation
- **Significance**: Granular categorization enables targeted redaction and risk scoring

### 3. **Text - Anonymize**
- **Purpose**: Redact all identified PHI by replacing with `#` character
- **Strategy**: Replaces each PHI element with `#` to maintain text structure while obscuring sensitive data
- **Example**: 
  - Before: "John Smith (MRN 123456) DOB 01/15/1980 reports chest pain"
  - After: "# (MRN #) DOB # reports chest pain"
- **Output**: Fully anonymized log safe for storage and analysis
- **Significance**: **Critical for compliance** — ensures no unredacted PHI enters the database or is accessible in logs

### 4. **Preprocessor - General Text**
- **Purpose**: Prepare anonymized logs for embedding and analysis
- **Operations**:
  - Tokenization: Break text into processable units
  - Normalization: Standardize formatting and case
  - Cleaning: Remove artifacts from redaction process
- **Output**: Preprocessed, anonymized text ready for vector embedding
- **Significance**: Ensures consistent treatment of logs across the system

### 5. **Embedding - Transformer**
- **Purpose**: Convert anonymized logs into high-dimensional vector embeddings
- **Technology**: Transformer-based embeddings for semantic understanding of logs
- **Corpus**: Creates embeddings that capture meaning of clinical interactions
- **Output**: Vector representation of the anonymized log
- **Significance**: Enables similarity search across logs, anomaly detection, and pattern analysis

### 6. **Vector Store - Odrant**
- **Purpose**: Store anonymized embeddings and maintain searchable audit logs
- **Data Stored**:
  - Vector embeddings of anonymized logs (for similarity search)
  - Anonymized log text (after PHI redaction)
  - PHI classification metadata (types detected, confidence scores)
  - Audit metadata: userID, patientID, timestamp, query, redaction details
- **Accessibility**: All stored data is already redacted—safe for long-term retention and analysis
- **Use Cases**:
  - **Similarity Search**: Find similar PHI exposure patterns across queries
  - **Trend Analysis**: Identify which PHI types are most frequently encountered
  - **Access Patterns**: Analyze which users access which types of patient data
  - **Anomaly Detection**: Flag unusual access patterns or unexpected PHI exposure
  - **Compliance Audits**: Generate reports of all PHI interactions with full redaction
- **Retention**: Configure retention policies to comply with HIPAA data retention requirements
- **Significance**: Creates a searchable, historical record of all redacted LLM interactions—enabling compliance verification and security analysis

### 7. **LLM - Gemini (Risk Severity Analysis from Logs)**
- **Purpose**: Analyze risk severity based on historical log patterns and redaction data
- **Input Sources**:
  - PHI classifications from current and historical logs
  - User access patterns (frequency of queries by userID)
  - Patient sensitivity profile (patientID data access history)
  - PHI exposure frequency (how often specific types are encountered)
  - Temporal patterns (clustering of accesses, time-of-day patterns)
- **Analysis Performed**:
  - **PHI Type Risk**: SSN exposure is higher risk than date exposure
  - **Access Context Risk**: Unusual user accessing sensitive patient increases risk
  - **Frequency Risk**: Multiple exposures of same PHI to same user indicates potential misuse
  - **Patient Risk**: Certain patients may be flagged as higher sensitivity (VIPs, legal holds, etc.)
  - **Temporal Risk**: Unusual access times or patterns trigger alerts
- **Output**: Risk severity assessment with components:
  - **Severity Level**: LOW, MEDIUM, HIGH, CRITICAL
  - **Risk Factors**: List of factors contributing to severity
  - **Confidence Score**: How confident the analysis is
  - **Recommendations**: Suggested actions (audit, notification, blocking, etc.)
- **Significance**: **Enables proactive compliance management** — identifies high-risk exposures and patterns that require investigation or remediation

### 8. **HTTP Results (Output)**
- **Purpose**: Generate final JSON response for database storage and frontend display
- **Content**: All data is **already redacted** before being sent in results
- **Output Schema**:
  ```json
  {
    "status": "success/error",
    "timestamp": "2024-01-15T10:30:00Z",
    "query": "What is the patient's current medication?",
    "original_response_anonymized": "Patient # is on # medication prescribed by Dr. #",
    "user_id": "user_12345",
    "patient_id": "patient_67890",
    "phi_classifications": [
      {
        "type": "PATIENT_NAME",
        "count": 1,
        "confidence": 0.99,
        "redaction_status": "redacted"
      },
      {
        "type": "MEDICATION",
        "count": 1,
        "confidence": 0.95,
        "redaction_status": "redacted"
      }
    ],
    "redaction_summary": {
      "total_phi_elements_found": 3,
      "total_phi_elements_redacted": 3,
      "redaction_rate": "100%"
    },
    "risk_analysis": {
      "severity": "MEDIUM",
      "factors": [
        "Patient name exposed (redacted)",
        "User accessing during off-hours",
        "Third access to this patient today"
      ],
      "confidence": 0.92,
      "recommendations": ["Log access event", "Monitor for patterns"]
    },
    "vector_id": "emb_abc123def456",
    "storage_ready": true,
    "audit_metadata": {
      "redaction_tool": "Aparavi",
      "risk_analysis_engine": "Gemini",
      "compliance_version": "HIPAA-2024"
    }
  }
  ```
- **Storage Destination**: Database receives **fully anonymized records** with redaction proof
- **Frontend Display**:
  - Anonymized log entry
  - Risk severity indicator
  - PHI exposure summary (redacted)
  - Recommendations for compliance team
- **Significance**: Every stored record includes proof of redaction, enabling compliance verification and audit trail integrity

## Complete Workflow Example

User Jane (ID: user_789) queries patient data for John Smith (ID: pat_456):

```
1. PATHWAY INGESTION
   ├─ Patient record arrives: "John Smith, SSN 123-45-6789, DOB 1985-03-15"
   ├─ Pathway ingests and maintains current context
   └─ Context stored in real-time memory

2. USER QUERY
   └─ Jane asks: "What medications is the patient on?"

3. PATHWAY + GEMINI LLM
   ├─ Pathway provides current patient context to Gemini
   ├─ Gemini generates: "John Smith is currently on Lisinopril 10mg and Metformin 500mg prescribed by Dr. Johnson"
   └─ Response sent to Frontend for display

4. APARAVI WEBHOOK TRIGGER
   └─ Pathway sends full logs to Aparavi for redaction:
      {
        "query": "What medications is the patient on?",
        "response": "John Smith is currently on Lisinopril 10mg and Metformin 500mg prescribed by Dr. Johnson",
        "user_id": "user_789",
        "patient_id": "pat_456"
      }

5. APARAVI PROCESSING
   ├─ Classification: [PATIENT_NAME], [MEDICATION], [DOCTOR_NAME] detected
   ├─ Anonymization: "# is currently on # and # prescribed by Dr. #"
   ├─ Embedding: Vector created from anonymized text
   ├─ Vector Store: Anonymized log + embeddings stored in Odrant
   └─ Gemini Risk Analysis:
       ├─ PHI Risk: MEDIUM (name + medications + doctor)
       ├─ Access Risk: LOW (Jane is authorized clinician)
       ├─ Temporal Risk: MEDIUM (query at 2 AM)
       └─ Overall Severity: MEDIUM

6. DATABASE STORAGE
   └─ Fully anonymized record stored:
      {
        "query": "What medications is the patient on?",
        "response_anonymized": "# is currently on # and # prescribed by Dr. #",
        "phi_count": 3,
        "redaction_rate": "100%",
        "risk_severity": "MEDIUM",
        "timestamp": "2024-01-15T02:00:00Z"
      }

7. FRONTEND DISPLAY
   └─ Dashboard shows:
      - Query: "What medications is the patient on?"
      - Risk: MEDIUM (⚠️ Flagged due to off-hours access)
      - Recommendations: "Monitor for repeated off-hours access patterns"
```

## Backend — Quick Setup and Run (Windows, cmd.exe)

Prerequisites:

- Python 3.8+ (recommended). A virtual environment is advised.
- Pathway library for real-time streaming and context management
- Google Gemini API key (for LLM query processing and risk analysis)
- Aparavi webhook endpoint credentials (Webhook Interface URL, Public Authorization Key, Private Token)
- Odrant vector database instance for log storage
- Network connectivity to all services

Installation:

```cmd
# create and activate a venv (Windows cmd)
python -m venv .venv
.venv\Scripts\activate

pip install --upgrade pip
pip install pathway rich google-generativeai requests

# Configure environment variables
set GEMINI_API_KEY=your-gemini-api-key
set APARAVI_WEBHOOK_URL=https://eaas-stg.aparavi.com/webhook
set APARAVI_PUBLIC_AUTH_KEY=your-public-authorization-key
set APARAVI_PRIVATE_TOKEN=your-private-token
set ODRANT_HOST=your-odrant-instance
set ODRANT_PORT=6333

# run the streaming backend with context updating
python Backend\main.py
```

What you should see:

- Console message indicating Pathway is ready and monitoring `./health_input/`
- Real-time streaming updates as patient data arrives
- Context updates logged as new information is ingested
- LLM query processing confirmation with response
- Webhook trigger confirmation showing redaction initiation
- Aparavi processing feedback (classification results, risk analysis)
- Final confirmation of anonymized logs stored in database
- `patient_notes_stream.jsonl` updated with fully redacted entries after Aparavi processing completes

Example CSV row (append to `health_input/patient_notes.csv`):

```csv
pat_456,"Patient John Smith (SSN 123-45-6789, DOB 1985-03-15) reports chest pain, MRN ABC987"
```

Expected flow:
1. Pathway ingests and updates context in real-time
2. User query: "Patient's current status?"
3. Pathway sends to Gemini with current context
4. Gemini responds with clinical summary
5. Pathway sends response + logs to Aparavi webhook
6. Aparavi classifies PHI (PATIENT_NAME, SSN, DOB, MRN)
7. Aparavi redacts: "Patient # (SSN #, DOB #) reports chest pain, MRN #"
8. Gemini analyzes risk as HIGH (multiple PHI types exposed)
9. Odrant stores fully anonymized embeddings and logs
10. HTTP results returned with 100% redaction confirmation
11. Frontend and database receive anonymized records only

## Frontend — Run / Test

The `Frontend/` folder contains static HTML, JS and TypeScript files. It displays:
- Anonymized patient query results and LLM responses
- Risk severity indicators based on historical log analysis
- PHI redaction confirmation and statistics
- Compliance audit logs (fully redacted and searchable)
- User access patterns and anomalies

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

The Aparavi PHI redaction pipeline uses three credentials:

1. **Webhook Interface URL**: `https://eaas-stg.aparavi.com/webhook`
   - Entry point for sending LLM logs requiring redaction
2. **Public Authorization Key**
   - Primary authentication credential
   - Included in Authorization header
3. **Private Token**
   - Secondary authentication for enhanced security
   - Can be included as custom header or query parameter

### Request Format

```
Method: PUT
URL: https://eaas-stg.aparavi.com/webhook?token=<task-token>&type=<task-type>
Headers:
  Authorization: <Public Authorization Key>
  X-Private-Token: <Private Token>
  Content-Type: multipart/form-data
Body:
  LLM logs with potential PHI (text/JSON)
```

### Workflow Components Configuration

Each Aparavi workflow component can be customized for your specific compliance needs:

- **Text - Classification**: 
  - Configure PHI categories (names, MRNs, SSNs, dates, medical record numbers, insurance IDs, contact info, etc.)
  - Adjust confidence thresholds for detection
  - Add custom PHI patterns specific to your organization
  
- **Text - Anonymize**: 
  - Set redaction character (currently `#`)
  - Configure redaction strategy (placeholder vs. removal vs. hashing)
  - Apply different rules to different PHI types
  
- **Preprocessor**: 
  - Configure tokenization rules and language handling
  - Customize normalization for clinical terminology
  
- **Embedding**: 
  - Select transformer model for semantic analysis of logs
  - Configure embedding dimensionality
  
- **Vector Store (Odrant)**: 
  - Configure similarity search thresholds for anomaly detection
  - Set retention policies for compliance requirements
  - Enable full-text search on anonymized logs
  
- **LLM - Gemini**: 
  - Fine-tune risk severity prompts for your organization
  - Customize risk scoring rubrics and thresholds
  - Define risk factors specific to your compliance needs

### Testing Aparavi Integration

To manually test the redaction workflow in Postman:

1. **Prepare Test Data**:
   ```json
   {
     "query": "What is patient John Smith's SSN?",
     "response": "The SSN is 123-45-6789",
     "user_id": "test_user",
     "patient_id": "test_patient"
   }
   ```

2. **Send to Aparavi**:
   ```
   PUT https://eaas-stg.aparavi.com/webhook
   Authorization: <Your Public Authorization Key>
   X-Private-Token: <Your Private Token>
   Content-Type: application/json
   
   Body: [test data above]
   ```

3. **Expected Response**:
   ```json
   {
     "status": "success",
     "original_anonymized": "What is patient #'s SSN?",
     "response_anonymized": "The SSN is #",
     "phi_classifications": [...],
     "risk_severity": "HIGH",
     "vector_id": "..."
   }
   ```

## Data Contract

### Input (from Pathway to Aparavi)
- **LLM Response**: Full text output from Gemini (may contain PHI)
- **Original Query**: User's question or request
- **userID**: Identifier of user making the request
- **patientID**: Identifier of patient data being accessed
- **Query Timestamp**: When the query was made
- **Context Metadata**: Additional context about the interaction

### Processing (Aparavi Workflow)
- PHI detection and multi-type categorization
- Text anonymization with `#` redaction character
- Vector embedding of anonymized logs
- Risk severity analysis based on log patterns and access context

### Output (to Database and Frontend)
- **Anonymized Text**: All PHI replaced with `#`
- **PHI Classifications**: Types detected and redaction status
- **Redaction Summary**: Confirmation of 100% redaction
- **Risk Severity Score**: LOW, MEDIUM, HIGH, or CRITICAL
- **Risk Analysis**: Factors contributing to severity
- **Audit Metadata**: Full audit trail with redaction proof
- **Vector ID**: Reference for similarity search and future analysis
- **Storage Ready Flag**: Confirms data is safe to store

## Compliance & Security Considerations

1. **PHI Redaction Before Storage**: All LLM logs are redacted **before** being stored in the database. This is enforced by the Aparavi workflow returning HTTP results only after redaction is complete.

2. **Audit Logging**: Every LLM interaction is logged with:
   - Complete redaction confirmation (100% redaction rate)
   - PHI types identified and redacted
   - User and patient identifiers
   - Timestamp and context
   - Risk severity assessment

3. **Risk Analysis on Historical Logs**: Gemini LLM analyzes patterns across stored logs to identify:
   - Unusual access patterns
   - High-risk PHI exposures
   - Potential data misuse
   - Compliance violations

4. **Vector-Based Anomaly Detection**: Odrant enables:
   - Similarity search for identical or near-identical queries (detect copy-paste of PHI)
   - Pattern clustering to find related exposures
   - Temporal analysis for unusual access times

5. **Access Control**: 
   - Secure storage of Aparavi credentials (use environment variables or secrets manager)
   - Role-based access to redacted logs
   - Audit of who accesses compliance data

6. **Retention Policies**: 
   - Configure Odrant retention to comply with HIPAA requirements
   - Automatic deletion of logs after retention period
   - Maintain compliance documentation of deletions

7. **Encryption**: 
   - All communications to Aparavi use HTTPS
   - Consider encryption of stored vectors in Odrant
   - Protect credential storage at rest

## Edge Cases & Error Handling

- **Redaction Failures**: If Aparavi cannot fully redact logs, HTTP results are not returned and storage is prevented. Manual review is triggered.
- **PHI Detection Edge Cases**: Some PHI types (variations in formatting, abbreviations, nicknames) may not be caught. Configure custom patterns for organization-specific PHI.
- **Network Timeouts**: Implement retry logic with exponential backoff for webhook calls. Store logs locally until Aparavi processing succeeds.
- **Vector Store Full**: Monitor Odrant capacity; implement cleanup policies for old embeddings based on retention requirements.
- **Risk Analysis Inaccuracies**: Gemini may misclassify risk levels. Monitor patterns and tune prompts regularly.
- **Context Loss**: Pathway's in-memory context can be lost on restart. Implement persistent context storage if needed.

## Extending the System

### Adding New PHI Categories

Update the Aparavi Text - Classification component to recognize additional PHI types:
- Insurance policy numbers
- Bank account information
- Genetic/biometric data
- International healthcare identifiers
- Organization-specific sensitive fields

### Custom Risk Scoring

Modify Gemini LLM risk analysis prompts to incorporate:
- Custom business logic and policies
- Industry-specific compliance requirements
- Patient sensitivity classifications
- User role-based risk calculations
- Historical breach patterns

### Integration with External Systems

Use the HTTP Results JSON output to integrate with:
- SIEM systems (Splunk, ELK) for security monitoring and alerting
- Compliance dashboards for real-time reporting
- Alert systems for high-risk exposures (email, Slack notifications)
- Data warehouses for long-term trend analysis
- Incident response platforms for automated remediation
- Policy enforcement systems for dynamic access control

## Logging and Monitoring

The system uses multiple logging layers for comprehensive audit trails:

- **Pathway Console**: Real-time feedback on data ingestion, context updates, and LLM processing
- **Pathway Streaming Logs**: `patient_notes_stream.jsonl` stores all interactions (redacted by Aparavi before logging)
- **Aparavi Logs**: Classification, redaction, and embedding details
- **Vector Store Logs**: Searchable audit trails in Odrant with all data redacted
- **HTTP Results**: JSON responses for each LLM interaction processed
- **Frontend Dashboard**: User-facing view of anonymized logs and risk indicators

For production deployment, integrate with:
- Python `logging` framework for structured logs (JSON format for parsing)
- Prometheus or similar for metrics:
  - Query count and frequency
  - Risk distribution (LOW/MEDIUM/HIGH/CRITICAL)
  - Redaction success rate (target: 100%)
  - Average response latency
- Centralized log aggregation (ELK, Splunk, CloudWatch, DataDog)
- Alerting on:
  - Redaction failures (immediate investigation required)
  - HIGH/CRITICAL risk detections (within 15 minutes)
  - Unusual access patterns (within 1 hour)
  - Vector store capacity thresholds (preventive)

## Troubleshooting

### Aparavi Webhook Returns "Task token is required"

The token in your webhook URL is not being recognized as a valid task token. This typically means:
- The token passed in query parameters (`?token=...`) doesn't match Aparavi's expectations
- You may need to first initialize a task with Aparavi to get a proper task token
- Verify that `Public Authorization Key` is being passed in the `Authorization` header
- Try including `Private Token` in an `X-Private-Token` header

### PHI Not Being Redacted or Redaction Incomplete

Check:
- Aparavi Text - Classification confidence thresholds (may be set too high)
- Custom PHI patterns configured for your organization
- Language/encoding of the LLM response (ensure UTF-8)
- Special characters in PHI that may be interfering with pattern matching
- Enable detailed logging in Aparavi to see what was/wasn't classified

### Risk Severity Always "LOW" or Always "HIGH"

Review Gemini LLM risk analysis prompts:
- Check if risk factors are being evaluated correctly
- Ensure user authorization levels are being considered
- Verify patient sensitivity profiles are set up
- Test with known high/low risk scenarios to verify prompt is working
- Adjust risk factor weighting to align with your compliance requirements

### Vector Store (Odrant) Not Responding

Troubleshoot connectivity:
- Verify Odrant instance is running: `curl http://odrant-host:6333/health`
- Check network connectivity between Pathway and Odrant
- Verify authentication credentials if Odrant requires them
- Check Odrant logs for errors
- Ensure Odrant has sufficient disk space and memory
- Monitor for rate limiting or connection pool exhaustion

### Logs Not Appearing in Database After Redaction

Verify the full pipeline:
- Confirm Aparavi webhook is returning `storage_ready: true`
- Check that HTTP Results are being received by your database insertion layer
- Verify database connection and write permissions
- Ensure logs are fully redacted (100% redaction rate) before storage attempt
- Check for any downstream processing failures after Aparavi response

### Performance/Latency Issues

Optimize at each stage:
- **Pathway**: Monitor streaming performance, increase context update frequency if needed
- **Gemini LLM**: Consider using faster models for query processing, cache common responses
- **Aparavi**: Check Classification component performance, may need to reduce PHI categories or lower confidence thresholds
- **Vector Embedding**: Batch embeddings, use GPU acceleration if available
- **Odrant**: Index optimization, query optimization, consider sharding for large datasets

## References

- [Pathway Documentation](https://pathway.com/docs) — Real-time streaming and context management
- [Google Gemini API](https://ai.google.dev/) — LLM processing and risk analysis
- [Aparavi Data Toolchain for AI](https://aparavi.com/documentation-aparavi/) — PHI detection and redaction
- [Odrant Vector Database](https://qdrant.tech/documentation/) — Embeddings and similarity search
- [HIPAA Compliance Guidelines](https://www.hhs.gov/hipaa/) — Regulatory requirements for PHI handling
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework/) — Security best practices


