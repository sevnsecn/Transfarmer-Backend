@echo off

start cmd /k "cd services/auth-service && npm start"
start cmd /k "cd services/farm-service && npm start"
start cmd /k "cd services/product-service && npm start"
start cmd /k "cd services/order-service && npm start"
start cmd /k "cd services/upload-service && npm start"