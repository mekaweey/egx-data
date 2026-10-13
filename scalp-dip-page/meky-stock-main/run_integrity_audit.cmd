@echo off
cd /d D:\meky-stock-main\meky-stock-main
node data_integrity_audit.cjs >> integrity_audit_log.txt 2>&1
