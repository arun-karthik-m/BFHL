#!/bin/bash

URL="http://localhost:3000/bfhl"

run_test() {
  local data="$1"
  echo "--- Test Case: $data ---"
  curl -s -X POST -H "Content-Type: application/json" -d "{\"data\": $data}" $URL | jq .
  echo -e "\n"
}

run_test '["A->B","A->B","A->B","A->B"]'
run_test '["A->D","B->D","C->D"]'
run_test '["A->B","B->C","C->A","D->E"]'
run_test '["A->B","B->C","C->A","C->D"]'
run_test '["A->B","A->C","B->D","C->E","E->F"]'
run_test '["B->C","A->C"]'
run_test '["A->B","hello","X->Y","Y->X"]'
run_test '[]'
run_test '["   "]'
