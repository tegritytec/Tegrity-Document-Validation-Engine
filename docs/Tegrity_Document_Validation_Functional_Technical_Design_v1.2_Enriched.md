# Tegrity Document Validation ('TDV') — Functional & Technical Design Specification
**Version 1.2 (Enriched Production Release) · October 9, 2026 · Author: @Ashwani / Tegrity AI Architecture Team**

---

## 1. Document Control & Executive Summary

### 1.1 Purpose and Scope
Tegrity Document Validation (**TDV**) is an enterprise-grade, cloud-native, AI-assisted contract validation and risk governance solution built specifically for the global shipping and maritime sector. TDV checks charter parties (voyage, time, bareboat), contracts of affreightment (COAs), bills of lading, fixture recaps, rider clauses, engagement letters, and voyage instructions against a governed **Compliance Rules Repository (F1)** and an anonymized **Clause Intelligence Knowledge Base (F2)**.

TDV calculates quantified financial risk exposure (expected loss in USD) and case-level risk scores ($S_{case} \in [0, 100]$), empowers Subject Matter Experts (SMEs) to perform interactive what-if simulations, enforces governed multi-tiered approval workflows with **Segregation of Duties (SoD)**, maintains a tamper-evident **Cryptographic Audit Lineage (F7)**, and feeds ratified outcomes back into an anonymized **Self-Learning Pipeline (F8)**.

### 1.2 Core Design Principles
1. **Explainable by Default**: Every AI verdict links directly to source document text spans, cited regulatory rules, matched clause patterns, and model confidence scores.
2. **Human-in-the-Loop Governance**: AI proposes findings and recommendations; SMEs review, simulate, and modify; named Approvers ratify. No AI decision is final without human sign-off.
3. **Privacy by Design & $k$-Anonymity**: The shared clause intelligence knowledge base contains zero party names, vessel identifiers, or commercial terms. All patterns enforce mathematical **$k$-anonymity ($k \ge 5$)** and $l$-diversity.
4. **Immutable Versioning & Lineage**: Rules, clause patterns, prompts, models, and decisions are versioned. Every action writes a SHA-256 hash-chained audit event.
5. **Modular Cloud-Native Architecture**: Built as decoupled domain microservices communicating synchronously via REST/gRPC and asynchronously over an event bus.

---

## 2. Opportunities for Improvement (OFI Analysis: v0.1 Draft vs v1.2 Enriched)

| Architectural Dimension | Draft Specification (v0.1) | Enriched Specification (v1.2 Production-Ready) |
| :--- | :--- | :--- |
| **F1 Rule Execution Engine** | High-level rule metadata; generic logic description text. | **JSON Schema Rule DSL**: Deterministic condition expressions + semantic LLM prompts with precedence resolution trees (Recap > Rider > Base CP). |
| **F2 Anonymization & Privacy** | Stated $k \ge 5$ requirement without mathematical gate. | **Formal Privacy Pipeline**: Presidio NER + Maritime Regex Tokenization + $k$-Anonymity ($k \ge 5$) & $l$-Diversity privacy check gates before publish. |
| **F4 RAG AI Search** | Generic hybrid search mentioned without ranking details. | **Dense + Sparse Hybrid RAG**: pgvector / OpenSearch dense embeddings + Sparse BM25 + Reciprocal Rank Fusion (RRF) with LLM critique & schema validation guardrails. |
| **F5 Financial Impact Model** | Basic $EL_i = p_i \times E_i$ definition. | **Calibrated Exposure Engine**: Integrates vessel DWT, demurrage rates, voyage days, and live Tegrity Voyage IQ telemetry (EU ETS EUA carbon prices & CII ratings). |
| **F6 SME Review & SoD Engine** | Textual SoD rules without policy enforcement engine. | **Open Policy Agent (OPA / Rego)**: Executable OPA policy code enforcing approval tiers (T1/T2/T3), financial override 2-level sign-offs, and self-approval blocks. |
| **F7 Lineage & Audit Trail** | Simple hash chain listed. | **Cryptographic Lineage**: CloudEvents JSON schema, SHA-256 hash chaining, and daily Merkle tree root anchoring. |
| **F9 Report Redline Engine** | PDF/DOCX format list. | **Native OpenXML Redline Engine**: Programmatic tracked-changes generation in Word (`w:ins` / `w:del`) + OTP security link lifecycle. |
| **Data Architecture** | Conceptual entity tables. | **Complete PostgreSQL DDL Schemas**: Foreign keys, row-level security (RLS), indexes, JSONB fields, and event bus contracts. |

---

## 3. Target Functional Architecture (Capabilities F1 to F9)

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                TEGRITY DOCUMENT VALIDATION (TDV)                          │
├─────────────────┬─────────────────┬─────────────────┬──────────────────┬──────────────────┤
│ F1 Rules Repo   │ F2 Clause Intel │ F3 Ingestion    │ F4 Analysis Engine│ F5 Risk Scorecard│
│ (IMO, MARPOL,   │ (Anonymized     │ (OCR, Precedence│ (Hybrid RAG,     │ (Noisy-OR,       │
│ Sanctions, ETS) │ Patterns, k≥5)  │ Extracted Terms)│ Multi-Pass LLM)  │ Expected Loss $) │
├─────────────────┼─────────────────┼─────────────────┼──────────────────┼──────────────────┤
│ F6 SME Workbench│ F7 Audit Lineage│ F8 Self-Learning│ F9 Report Engine │ Integration Hub  │
│ (What-If, OPA   │ (SHA-256 Hash   │ (NER Redaction, │ (DOCX Redlines,  │ (Voyage IQ, DMS, │
│ Tiered Ratify)  │ Merkle Roots)   │ Curator Queue)  │ OTP Security)    │ Claims, Slack)   │
└─────────────────┴─────────────────┴─────────────────┴──────────────────┴──────────────────┘
```

### 3.1 Capability F1 — Compliance Rules Repository
Governed library of machine-executable rules organized into rule packs (e.g., *"Dry Bulk Voyage Charter — EU/UK Sanctions & Emissions 2024"*).
- **Rule Taxonomy**: Level (International convention, National law, Industry standard, Client policy), Domain (Sanctions, Environmental, Safety, Cargo Liability, Commercial, Insurance), Jurisdiction (Global, Flag state, Governing law), Applicability (Trade, Charter type, Vessel class).
- **Rule DSL**: Rules combine deterministic logic (e.g., `field.demurrage_rate > 0`) with semantic intent prompts evaluated by LLMs.
- **Precedence Hierarchy**: Resolves conflicts across contract document sets (Fixture Recap overrides Rider Clauses; Rider Clauses override Base Charter Party form).

### 3.2 Capability F2 — Anonymized Clause Intelligence Repository
Anonymized knowledge base of clause patterns linked to historical empirical evidence (dispute frequency %, claim success rate %, median financial impact USD bucket).
- **Privacy Assurance**: All party names, vessel names/IMO numbers, ports below region level, and exact monetary values are tokenized or generalized. Records require **$k$-anonymity ($k \ge 5$)** across context fields.

### 3.3 Capability F3 — Document Ingestion & Structuring
- Multi-file drag & drop supporting PDF (native/scanned), DOCX, EML/MSG, images, and ZIP bundles.
- Layout-aware OCR with quality scoring (pages with quality < 80% trigger low-confidence alerts).
- Automatic document classification and extraction of key commercial terms (Charterer, Owner, Freight rate, Demurrage rate, Laytime allowance, Governing law).

### 3.4 Capability F4 — Hybrid Analysis & Validation Engine
Multi-pass analysis pipeline executing:
1. **Presence & Prohibition Checks**: Verifies mandatory clauses exist (Sanctions, EU ETS pass-through) and prohibited terms are absent.
2. **Threshold & Precedence Checks**: Validates numerical bounds (demurrage caps, laytime windows) and resolves conflicts across recaps and rider clauses.
3. **Semantic RAG Validation**: Hybrid vector search (pgvector) + BM25 retrieve top-k matching F2 patterns and F1 rules, prompting the LLM to judge compliance, cite exact text spans, and assign confidence scores.

### 3.5 Capability F5 — Risk Scoring & Impact Quantification
- **Finding Score ($S_i \in [0, 100]$)**: Combines likelihood ($p_i$), logarithmic exposure ($\hat{E}_i$), rule severity ($\hat{s}_i$), and qualitative impact ($\hat{q}_i$), dampened by model confidence ($c_i^\alpha$).
- **Case Score ($S_{case} \in [0, 100]$)**: Aggregated via Noisy-OR compounding formula ($S_{case} = \max(S_{max}, 100(1 - \prod (1 - S_i/100)^\beta))$). Any unresolved Critical compliance gap enforces a score floor of 75 (Critical Risk Band).
- **Quantified Exposure ($EL = p \times E$)**: Reports expected loss as low, likely, and high USD ranges.

### 3.6 Capability F6 — SME Review, What-If Simulator & Tiered Ratification
- **Split-Screen Workbench**: Interactive document text viewer with highlighted spans on left; finding inspector, review actions (Accept, Reject, Modify), and What-If simulator on right.
- **What-If Engine**: Allows SMEs to swap clause wording or adjust financial parameters; recalculates finding and case risk scores live (<10s feel). Saves up to 5 named scenarios for side-by-side matrix comparison.
- **OPA Tiered Ratification Engine**: Enforces approval tiers:
  - **T1 Standard**: Low/Moderate risk, expected loss < $250k (1 Approver).
  - **T2 Elevated**: High risk or expected loss $250k–$1M (2 Approver levels).
  - **T3 Critical**: Critical risk or expected loss ≥ $1M (2 Approver levels + Head of Legal/CFO).
  - **Segregation of Duties (SoD)**: Blocks submitter self-approval; requires two distinct approvers for financial overrides.

### 3.7 Capability F7 — Metadata & Cryptographic Audit Lineage
- Writes immutable CloudEvents JSON audit logs for every ingestion, edit, analysis run, scenario save, and ratification.
- Events are SHA-256 hash-chained; daily anchor hashes are published to immutable storage for cryptographic verification.

### 3.8 Capability F8 — Self-Learning Pipeline
- Ratified SME reviews pass through an automated NER/PII tokenization gate, privacy check ($k \ge 5$), and candidate clustering pipeline.
- Curators review, merge, or publish new clause patterns into F2.

### 3.9 Capability F9 — Multi-Format Report Generation & Secure Sharing
- Generates Executive Briefs (PDF/web), Detailed Audit Reports, and counterparty tracked-changes **Redline Packs (DOCX OpenXML)**.
- Secure external link sharing with automated redaction of internal scores/comments, OTP email verification, 14-day expiry, and dynamic watermarking.

---

## 4. Mathematical Risk & Impact Quantification Model (Section 18 Enriched)

### 4.1 Finding Expected Loss ($EL_i$)
$$EL_i = p_i \times E_i$$

Where:
- $p_i \in [0, 1]$ is the empirical dispute/claim probability retrieved from F2 pattern benchmarks.
- $E_i$ is the quantified exposure base in USD.

**Exposure Base Formulas ($E_i$):**
- **Demurrage Time-Bar Risk**: $E_i = \text{Demurrage Rate (\$/day)} \times \text{Expected Delay Days} \times \text{Waiver Risk Share}$
- **EU ETS EUA Risk**: $E_i = \text{Estimated Fuel Consumption (MT)} \times \text{Carbon Factor} \times \text{EUA Spot Price (\$/ton CO2)}$
- **Sanctions Breach Exposure**: $E_i = \text{Vessel Value / Freight Value} + \text{Regulatory Fine Schedule}$

### 4.2 Finding Score ($S_i$)
$$S_i = 100 \times \left( w_p \hat{p}_i + w_e \hat{E}_i + w_s \hat{s}_i + w_q \hat{q}_i \right) \times c_i^{\alpha}$$

Where:
- Weights: $w_p = 0.30$, $w_e = 0.35$, $w_s = 0.25$, $w_q = 0.10$.
- $\hat{E}_i = \min\left(1, \frac{\ln(1 + E_i)}{\ln(1 + 2,000,000)}\right)$ (Logarithmic exposure scaling against $2M benchmark).
- $\hat{s}_i \in \{0.25, 0.50, 0.75, 1.00\}$ for Low, Medium, High, Critical severity.
- $c_i \in [0.1, 1.0]$ is model confidence, dampened by parameter $\alpha = 0.5$.

### 4.3 Case Score ($S_{case}$) Noisy-OR Aggregation
$$S_{case} = \max\left( S_{max}, \; 100 \times \left(1 - \prod_{i=1}^{N} \left(1 - \frac{S_i}{100}\right)^{\beta}\right) \right)$$

Where parameter $\beta = 0.5$ controls score compounding across multiple findings.

**Critical Gap Floor Enforcement:**
$$\text{If } \exists \, f_i \text{ where } \text{Severity}(f_i) = \text{Critical}, \, \text{Type}(f_i) = \text{Compliance Gap}, \, \text{Status}(f_i) = \text{Open} \implies S_{case} \ge 75$$

---

## 5. Security & Policy Engine (OPA / Rego Implementation)

### 5.1 Segregation of Duties & Tiered Approval Rego Policy (`tod_policy.rego`)
```rego
package tdv.authz

default allow = false

# Allow decision ratification if SoD and Tier requirements are met
allow {
    input.action == "RATIFY_DECISION"
    not is_submitter_self_approving
    is_valid_approval_tier
}

# Block submitters from approving their own cases
is_submitter_self_approving {
    input.user.id == input.case.submitter_id
}

# Tier 1 Approval Check
is_valid_approval_tier {
    input.case.calculated_tier == "T1 Standard"
    count(input.decision.approvers) >= 1
}

# Tier 2 Approval Check
is_valid_approval_tier {
    input.case.calculated_tier == "T2 Elevated"
    count(input.decision.approvers) >= 2
}

# Tier 3 Approval Check (Requires Legal/CFO Lead)
is_valid_approval_tier {
    input.case.calculated_tier == "T3 Critical"
    count(input.decision.approvers) >= 2
    user_has_role(input.decision.approvers[1], "Head of Legal")
}

user_has_role(user_id, role) {
    input.users[user_id].roles[_] == role
}
```

---

## 6. Relational Database Schemas (PostgreSQL DDL)

```sql
-- Enable UUID and Vector Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. Cases Table
CREATE TABLE tdv_cases (
    case_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    trade VARCHAR(100) NOT NULL,
    charter_type VARCHAR(50) NOT NULL,
    effective_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    risk_score INT NOT NULL DEFAULT 0,
    risk_band VARCHAR(20) NOT NULL DEFAULT 'Low',
    owner_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Documents Table
CREATE TABLE tdv_documents (
    doc_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES tdv_cases(case_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    file_uri TEXT NOT NULL,
    sha256 VARCHAR(64) NOT NULL,
    ocr_quality INT NOT NULL,
    pages INT NOT NULL,
    precedence_order INT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Clauses Table with Embeddings
CREATE TABLE tdv_clauses (
    clause_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_id UUID NOT NULL REFERENCES tdv_documents(doc_id) ON DELETE CASCADE,
    number VARCHAR(50) NOT NULL,
    heading VARCHAR(255) NOT NULL,
    clause_text TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    amends_clause_id UUID REFERENCES tdv_clauses(clause_id),
    embedding vector(1536)
);

-- 4. Compliance Rules (F1)
CREATE TABLE tdv_rules (
    rule_id VARCHAR(50) PRIMARY KEY,
    version VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    source_ref TEXT NOT NULL,
    domain VARCHAR(50) NOT NULL,
    jurisdiction VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    logic_description TEXT NOT NULL,
    model_clause TEXT NOT NULL,
    valid_from DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active'
);

-- 5. Clause Intelligence Patterns (F2)
CREATE TABLE tdv_clause_patterns (
    pattern_id VARCHAR(50) PRIMARY KEY,
    version VARCHAR(20) NOT NULL,
    category VARCHAR(100) NOT NULL,
    canonical_text TEXT NOT NULL,
    dispute_rate NUMERIC(4,3) NOT NULL,
    success_rate NUMERIC(4,3) NOT NULL,
    impact_band VARCHAR(20) NOT NULL,
    median_impact_usd INT NOT NULL,
    confidence NUMERIC(3,2) NOT NULL,
    k_anonymity_level INT NOT NULL DEFAULT 5,
    embedding vector(1536)
);

-- 6. Findings Table (F5)
CREATE TABLE tdv_findings (
    finding_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES tdv_cases(case_id) ON DELETE CASCADE,
    clause_id UUID NOT NULL REFERENCES tdv_clauses(clause_id),
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Open',
    rule_ids TEXT[] NOT NULL,
    pattern_ids TEXT[] NOT NULL,
    severity VARCHAR(20) NOT NULL,
    probability NUMERIC(4,3) NOT NULL,
    exposure_likely_usd INT NOT NULL,
    finding_score INT NOT NULL,
    confidence NUMERIC(3,2) NOT NULL,
    recommendation_action VARCHAR(50) NOT NULL,
    proposed_text TEXT NOT NULL,
    rationale TEXT NOT NULL
);

-- 7. Lineage Audit Events (F7)
CREATE TABLE tdv_lineage_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prev_hash VARCHAR(64) NOT NULL,
    hash VARCHAR(64) NOT NULL,
    actor VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    object_ref VARCHAR(255) NOT NULL,
    diff TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 7. OpenXML Redline Engine Specification (F9 DOCX Generation)

Redline packs are generated by programmatically manipulating Microsoft Word OpenXML tags on the source `.docx` contract file:

- **Inserted Text Wording**: Wrapped in `<w:ins>` tags:
  ```xml
  <w:ins w:id="1" w:author="TDV AI Engine" w:date="2026-10-09T10:00:00Z">
    <w:r><w:t>Charterers shall maintain AIS operational at all times.</w:t></w:r>
  </w:ins>
  ```
- **Deleted Original Text**: Wrapped in `<w:del>` tags:
  ```xml
  <w:del w:id="2" w:author="TDV AI Engine" w:date="2026-10-09T10:00:00Z">
    <w:r><w:delText>Vessel shall notify Master within reasonable time.</w:delText></w:r>
  </w:del>
  ```

---

## 8. Deployment Topology & Cloud Infrastructure

TDV is deployed on Google Cloud Run and Kubernetes (GKE) in GCP project `voyageiq-dev`:
- **Containers**: Multi-stage Node.js + Nginx containers exposed on port 8080.
- **Database**: GCP Cloud SQL for PostgreSQL (with `pgvector` extension enabled) + Cloud Storage for contract files.
- **LLM Gateway**: Enterprise Anthropic Claude 3.5 / Bedrock / Vertex AI endpoints under strict zero-data-retention agreements.
- **CI/CD & GitOps**: Terraform infrastructure provisioning + GitHub Actions push to container registry (`gcr.io/voyageiq-dev/tdv-app`).
