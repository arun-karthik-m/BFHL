# BFHL Challenge - Advanced Hierarchy & Graph API

A high-performance, bulletproof implementation of the BFHL Challenge API. This service handles complex node relationships, including tree construction, cycle detection, and undirected component grouping.

## Features

- **Strict Validation**: Enforces `^[A-Z]->[A-Z]$` edge formats.
- **Graph Processing**: 
    - Automated undirected component grouping.
    - Multi-parent isolation (Rule: First parent wins).
    - True Root detection vs. Cycle tie-breaking.
- **Data Engineering**:
    - Recursive nested tree construction.
    - Path depth calculation based on node count.
    - O(V+E) time complexity for sub-millisecond processing.
- **Security**: Production-ready CORS and strict input sanitization.

## API Documentation

### POST `/bfhl`

Processes an array of relationship strings and returns a structural analysis.

**Payload:**
```json
{
  "data": ["A->B", "B->C", "D->E"]
}
```

**Response:**
```json
{
  "user_id": "arun_karthik_m_24042026",
  "email_id": "arunkarthik.m@college.edu",
  "college_roll_number": "21CS9999",
  "hierarchies": [...],
  "invalid_entries": [...],
  "duplicate_edges": [...],
  "summary": {
    "total_trees": 2,
    "total_cycles": 0,
    "largest_tree_root": "A"
  }
}
```

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, TSX
- **Optimization**: Linear-time Graph Theory Algorithms
