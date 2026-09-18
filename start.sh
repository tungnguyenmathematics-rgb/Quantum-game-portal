#!/usr/bin/env bash
set -euo pipefail
cd backend
npm run seed:admin
npm start
