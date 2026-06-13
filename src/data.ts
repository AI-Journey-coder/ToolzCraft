import { Category, Tool } from "./types";

export const CATEGORIES: Category[] = [
  {
    id: "finance-money",
    title: "Finance & Money Core",
    icon: "DollarSign",
    tools: [
      { id: "emi-calc", name: "EMI Calculator", category: "finance-money", description: "Calculate Equated Monthly Installments for loans." },
      { id: "sip-calc", name: "SIP Calculator", category: "finance-money", description: "Project returns on Systematic Investment Plans." },
      { id: "swp-calc", name: "SWP Calculator", category: "finance-money", description: "Estimate withdrawals and balances from a Systematic Withdrawal Plan." },
      { id: "compound-interest", name: "Compound Interest Calculator", category: "finance-money", description: "Calculate compound growth of investments over time." },
      { id: "loan-calc", name: "Loan Calculator", category: "finance-money", description: "Analyze loan payments, schedules, and interest rates." },
      { id: "loan-eligibility", name: "Loan Eligibility Calculator", category: "finance-money", description: "Submit details to check potential loan eligibility bounds." },
      { id: "mortgage-calc", name: "Mortgage Calculator", category: "finance-money", description: "Determine mortgage payments and amortizations." },
      { id: "retirement-calc", name: "Retirement Calculator", category: "finance-money", description: "Formulate retirement savings plans and targets." },
      { id: "tax-calc", name: "Tax Calculator", category: "finance-money", description: "Estimate annual tax liabilities based on income slabs." },
      { id: "gst-calc", name: "GST Calculator", category: "finance-money", description: "Compute inclusive and exclusive Goods and Services Tax amounts." },
      { id: "salary-calc", name: "Salary Calculator", category: "finance-money", description: "Calculate take-home pay from gross earnings." },
      { id: "budget-calc", name: "Budget Calculator", category: "finance-money", description: "Evaluate income versus monthly expense splits." },
      { id: "roi-calc", name: "ROI Calculator", category: "finance-money", description: "Analyze simple return investments percentages." },
      { id: "irr-calc", name: "IRR Calculator", category: "finance-money", description: "Evaluate Internal Rate of Return for cash flows." },
      { id: "future-value", name: "Future Value Calculator", category: "finance-money", description: "Project the future value of a current sum with compound rates." },
      { id: "present-value", name: "Present Value Calculator", category: "finance-money", description: "Determine the current worth of expected future cash flows." },
      { id: "inflation-calc", name: "Inflation Calculator", category: "finance-money", description: "Calculate historic purchasing power shifts over time." },
      { id: "debt-payoff", name: "Debt Payoff Calculator", category: "finance-money", description: "Formulate acceleration plans for multiple debts." },
      { id: "credit-card-payoff", name: "Credit Card Payoff Calculator", category: "finance-money", description: "Calculate interest fees and payoff schedules." },
      { id: "group-splitter", name: "Group Expense Splitter", category: "finance-money", description: "Calculate fair balances for shared trippin or group expenses." }
    ]
  },
  {
    id: "everyday-calculators",
    title: "Everyday Calculators",
    icon: "Clock",
    tools: [
      { id: "age-calc", name: "Age Calculator", category: "everyday-calculators", description: "Find precise years, months, and days from date of birth." },
      { id: "date-difference", name: "Date Difference Calculator", category: "everyday-calculators", description: "Calculate duration and working days between two calendar dates." },
      { id: "time-duration", name: "Time Duration Calculator", category: "everyday-calculators", description: "Sum up hour sequences or find differences in times." },
      { id: "percentage-calc", name: "Percentage Calculator", category: "everyday-calculators", description: "Find fraction rates, percentage increments, and bases." },
      { id: "tip-calc", name: "Tip Calculator", category: "everyday-calculators", description: "Split restaurant checks with customized tip rates." },
      { id: "unit-converter", name: "Unit Converter", category: "everyday-calculators", description: "Convert Length, Mass, Volume, Temp with complete output tables." },
      { id: "currency-converter", name: "Currency Converter", category: "everyday-calculators", description: "Check real-time or approximate currency exchange ratios." },
      { id: "bmi-calc", name: "BMI Calculator", category: "everyday-calculators", description: "Evaluate body mass index and fitness categories." },
      { id: "calorie-calc", name: "Calorie Calculator", category: "everyday-calculators", description: "Calculate your estimated daily metabolic expenditure thresholds." },
      { id: "fuel-cost", name: "Fuel Cost Calculator", category: "everyday-calculators", description: "Evaluate fuel cost for distances with engine efficiency ratings." },
      { id: "gpa-calc", name: "GPA Calculator", category: "everyday-calculators", description: "Determine weighted GPA averages from course grades." },
      { id: "scientific-calc", name: "Scientific Calculator", category: "everyday-calculators", description: "Utilize advanced mathematical operators on a visual interface." }
    ]
  },
  {
    id: "contact-management",
    title: "Contact Management Suite",
    icon: "Users",
    tools: [
      { id: "contact-duplicate-finder", name: "Contact Duplicate Finder", category: "contact-management", description: "Analyze vCard/CSV contact rosters to find duplicates." },
      { id: "contact-merger", name: "Contact Merger", category: "contact-management", description: "Merge fields from identical files and standardize directories." },
      { id: "contact-cleaner", name: "Contact Cleaner", category: "contact-management", description: "Format contact numbers and clean invalid names." },
      { id: "contact-backup", name: "Contact Backup", category: "contact-management", description: "Download contacts catalog in backup structures." },
      { id: "contact-restore", name: "Contact Restore", category: "contact-management", description: "Recover formats from previous backups." },
      { id: "contact-export-excel", name: "Contact Export to Excel", category: "contact-management", description: "Convert standard vCard archives into XLSX spreadsheets." },
      { id: "contact-import-excel", name: "Contact Import from Excel", category: "contact-management", description: "Import CSV/XLSX contacts list into a standard vCard format." },
      { id: "contact-group-creator", name: "Contact Group Creator", category: "contact-management", description: "Organize contacts catalogs under labels or tags dynamically." },
      { id: "contact-tagger", name: "Contact Tagger", category: "contact-management", description: "Add tags to contact listings on bulk properties." },
      { id: "contact-missing-finder", name: "Contact Missing Data Finder", category: "contact-management", description: "Filter contacts lacking values for emails, numbers, or addresses." },
      { id: "contact-account-merger", name: "Contact Account Merger", category: "contact-management", description: "Align separate cloud formats (Google, Apple, Microsoft)." },
      { id: "contact-transfer-assistant", name: "Contact Transfer Assistant", category: "contact-management", description: "Facilitate device migrations of directories." }
    ]
  },
  {
    id: "whatsapp-suite",
    title: "WhatsApp Suite",
    icon: "MessageSquare",
    tools: [
      { id: "wa-export-analyzer", name: "Chat Export Analyzer", category: "whatsapp-suite", description: "Submit text export archives to inspect message patterns and activity graphs." },
      { id: "wa-group-analyzer", name: "Group Analyzer", category: "whatsapp-suite", description: "Determine dynamic trends in WhatsApp group exports." },
      { id: "wa-active-member", name: "Most Active Member Finder", category: "whatsapp-suite", description: "Plot leaderboard of contributors from text export file." },
      { id: "wa-chat-stats", name: "Chat Statistics", category: "whatsapp-suite", description: "Counts emojis, URLs, image markers, and message lengths from export." },
      { id: "wa-bulk-checker", name: "Bulk Contact Checker", category: "whatsapp-suite", description: "Check prefix validations and structures of bulk numbers list." },
      { id: "wa-link-generator", name: "WhatsApp Link Generator", category: "whatsapp-suite", description: "Build direct message links with prefilled text triggers." },
      { id: "wa-qr-generator", name: "WhatsApp QR Generator", category: "whatsapp-suite", description: "Compile direct scan QR codes linking directly to a chat number." },
      { id: "wa-invite-validator", name: "Group Invite Validator", category: "whatsapp-suite", description: "Parse invite code metadata structures." }
    ]
  },
  {
    id: "files-documents",
    title: "Files & Documents",
    icon: "FileText",
    tools: [
      { id: "pdf-merge", name: "PDF Merge", category: "files-documents", description: "Assemble multiple document listings inside a single PDF file." },
      { id: "pdf-split", name: "PDF Split", category: "files-documents", description: "Extract individual sheets or sheet arrays from massive files." },
      { id: "pdf-compress", name: "PDF Compress", category: "files-documents", description: "Optimize file weights of documents for fast uploads." },
      { id: "pdf-to-word", name: "PDF to Word", category: "files-documents", description: "Extract printable text paragraphs into .docx file assets.", isAiPowered: true },
      { id: "pdf-to-excel", name: "PDF to Excel", category: "files-documents", description: "Isolate structured tabular sheets into tables.", isAiPowered: true },
      { id: "pdf-ocr", name: "OCR", category: "files-documents", description: "Read typed textures directly out of scanned assets.", isAiPowered: true },
      { id: "image-compress", name: "Image Compression", category: "files-documents", description: "Shrink file payloads of JPG/PNG assets with control sliders." },
      { id: "image-converter", name: "Image Converter", category: "files-documents", description: "Transpose formats between WebP, PNG, JPEG, HEIC, and PDF." },
      { id: "file-converter", name: "File Converter", category: "files-documents", description: "Convert configuration layouts (JSON, YAML, CSV) cleanly." },
      { id: "qr-code-gen", name: "QR Code Generator", category: "files-documents", description: "Encode URLs or text blocks into downloadable vector QR codes." }
    ]
  },
  {
    id: "receipt-ocr",
    title: "Receipt & OCR Suite",
    icon: "Receipt",
    tools: [
      { id: "receipt-ocr-scan", name: "Receipt OCR", category: "receipt-ocr", description: "Analyze checkout tickets to map merchant, dates, and full line-items.", isAiPowered: true },
      { id: "invoice-ocr-scan", name: "Invoice OCR", category: "receipt-ocr", description: "Isolate metadata, totals, taxes, and vendor details from business invoices.", isAiPowered: true },
      { id: "bank-statement", name: "Bank Statement OCR", category: "receipt-ocr", description: "Extract transaction logs tables from scanned financial ledger PDF receipts.", isAiPowered: true },
      { id: "gst-invoice-extractor", name: "GST Invoice Extractor", category: "receipt-ocr", description: "Identify legal GST numbers, state codes, and rate allocations.", isAiPowered: true },
      { id: "expense-categorizer", name: "Expense Categorizer", category: "receipt-ocr", description: "Classify purchase orders and receipts into standard tax accounts.", isAiPowered: true },
      { id: "receipt-excel", name: "Receipt to Excel", category: "receipt-ocr", description: "Serialize scanned checkout receipts directly into downloadable XLS spreadsheets.", isAiPowered: true },
      { id: "invoice-excel", name: "Invoice to Excel", category: "receipt-ocr", description: "Transcribe business invoices into formatted financial rows.", isAiPowered: true },
      { id: "ocr-table", name: "OCR Table Extractor", category: "receipt-ocr", description: "Identify bordered tables in scans and format them to Markdown grids.", isAiPowered: true }
    ]
  },
  {
    id: "media-optimization",
    title: "Media Optimization",
    icon: "Image",
    tools: [
      { id: "dup-photo-finder", name: "Duplicate Photo Finder", category: "media-optimization", description: "Analyze file grids to report matching pixel structures or hashes." },
      { id: "similar-photo-finder", name: "Similar Photo Finder", category: "media-optimization", description: "Identify near-duplicate photographs taken in rapid succession." },
      { id: "dup-video-finder", name: "Duplicate Video Finder", category: "media-optimization", description: "Detect matches across large video listings using checksums." },
      { id: "screenshot-cleaner", name: "Screenshot Cleaner", category: "media-optimization", description: "Isolate, group, and archive mobile screenshots clutter." },
      { id: "photo-compression", name: "Photo Compression", category: "media-optimization", description: "Shrink high-res photos to manageable web dimensions." },
      { id: "video-compression", name: "Video Compression", category: "media-optimization", description: "Lower file bitrate of video containers without altering ratios." },
      { id: "heic-converter", name: "HEIC Converter", category: "media-optimization", description: "Tranpose Apple HEIC photos cleanly into responsive JPEG formats." },
      { id: "webp-converter", name: "WebP Converter", category: "media-optimization", description: "Encode standard photos into optimized Google WebP payloads." },
      { id: "bg-remover", name: "Background Remover", category: "media-optimization", description: "Isolate and eliminate background details from foreground figures.", isAiPowered: true },
      { id: "exif-viewer", name: "EXIF Viewer", category: "media-optimization", description: "Deconstruct lens properties, coordinates, camera types, and historic metadata." },
      { id: "exif-cleaner", name: "EXIF Cleaner", category: "media-optimization", description: "Erase private location markers, timestamps, and lenses properties." }
    ]
  },
  {
    id: "developer-hub",
    title: "Developer Hub",
    icon: "FileCode",
    tools: [
      { id: "api-tester", name: "API Tester", category: "developer-hub", description: "Test API payloads with visual forms and header builders.", isAiPowered: true },
      { id: "webhook-tester", name: "Webhook Tester", category: "developer-hub", description: "Inspect webhook structures and responses dynamically.", isAiPowered: true },
      { id: "api-response-viewer", name: "API Response Viewer", category: "developer-hub", description: "Pretty-print HTTP payloads and analyze content parameters.", isAiPowered: true },
      { id: "curl-converter", name: "cURL Converter", category: "developer-hub", description: "Translate curl actions layouts into Python, Nodejs, or Go codes.", isAiPowered: true },
      { id: "json-formatter", name: "JSON Formatter", category: "developer-hub", description: "Format raw JSON string blocks with customized indent values." },
      { id: "json-validator", name: "JSON Validator", category: "developer-hub", description: "Validate syntax of JSON grids and highlight error characters." },
      { id: "json-diff", name: "JSON Diff", category: "developer-hub", description: "Inspect comparison schemas of separate JSON objects." },
      { id: "json-schema-validator", name: "JSON Schema Validator", category: "developer-hub", description: "Verify payload structures against official AJV Schema definitions." },
      { id: "json-tree-viewer", name: "JSON Tree Viewer", category: "developer-hub", description: "Explore nested nodes in expandable interactive HTML cards." },
      { id: "code-formatter", name: "Code Formatter", category: "developer-hub", description: "Prettify multi-language script formats." },
      { id: "sql-formatter", name: "SQL Formatter", category: "developer-hub", description: "Beautify complex SQL queries with select linebreaks." },
      { id: "xml-formatter", name: "XML Formatter", category: "developer-hub", description: "Indent and nested clean XML tag hierarchies." },
      { id: "yaml-formatter", name: "YAML Formatter", category: "developer-hub", description: "Validate and prettify spacing of raw YAML configuration files." },
      { id: "jwt-decoder", name: "JWT Decoder", category: "developer-hub", description: "Decode payload headers and claims properties out of JSON Web Tokens instantly." },
      { id: "uuid-generator", name: "UUID Generator", category: "developer-hub", description: "Compile standard v4 UUID codes in clean newline array formats." },
      { id: "hash-generator", name: "Hash Generator", category: "developer-hub", description: "Generate md5, sha-1, sha-256, sha-512 hashes of entered inputs." },
      { id: "password-generator", name: "Password Generator", category: "developer-hub", description: "Compile highly randomized passwords strings with symbol caps settings." },
      { id: "regex-tester", name: "Regex Tester", category: "developer-hub", description: "Validate regular expression structures against customized target lines." },
      { id: "text-diff", name: "Text Diff", category: "developer-hub", description: "Inspect additions and deletions between text areas." },
      { id: "base64-encoding", name: "Base64 Encoder/Decoder", category: "developer-hub", description: "Translate normal utf8 text blocks into base64 markers." }
    ]
  },
  {
    id: "ai-utilities",
    title: "AI Utilities",
    icon: "Sparkles",
    tools: [
      { id: "token-counter", name: "Token Counter", category: "ai-utilities", description: "Estimate token totals of custom prompts.", isAiPowered: true },
      { id: "prompt-formatter", name: "Prompt Formatter", category: "ai-utilities", description: "Format, structure, and embellish core prompts lines for LLMs.", isAiPowered: true },
      { id: "markdown-converter", name: "Markdown Converter", category: "ai-utilities", description: "Convert standard markdown blocks to layouts structures.", isAiPowered: true },
      { id: "json-schema-gen", name: "JSON Schema Generator", category: "ai-utilities", description: "Generate schema definition constraints from JSON logs.", isAiPowered: true },
      { id: "openapi-generator", name: "OpenAPI Generator", category: "ai-utilities", description: "Generate valid Swagger/OpenAPI YAML specifications from code.", isAiPowered: true },
      { id: "prompt-to-json", name: "Prompt to JSON Converter", category: "ai-utilities", description: "Convert free text prompts guidelines into schema mappings.", isAiPowered: true },
      { id: "ai-cost-calc", name: "AI Cost Calculator", category: "ai-utilities", description: "Compare cost models of top models lists." }
    ]
  },
  {
    id: "mobile-utilities",
    title: "Mobile Utilities",
    icon: "Smartphone",
    tools: [
      { id: "phone-migration", name: "Phone Migration Assistant", category: "mobile-utilities", description: "Guides backups, directories structure formats transfers." },
      { id: "sms-backup", name: "SMS Backup", category: "mobile-utilities", description: "Parse XML/JSON SMS dumps to standard catalogs." },
      { id: "sms-restore", name: "SMS Restore", category: "mobile-utilities", description: "Realign backup scripts for phone application." },
      { id: "sms-export-excel", name: "SMS Export to Excel", category: "mobile-utilities", description: "Assemble text chains rows inside downloadable files." },
      { id: "call-log-analyzer", name: "Call Log Analyzer", category: "mobile-utilities", description: "Examine mobile call records to map patterns and timelines." },
      { id: "call-frequency", name: "Call Frequency Report", category: "mobile-utilities", description: "D3 graphics mapping top call targets." },
      { id: "storage-analyzer", name: "Storage Analyzer", category: "mobile-utilities", description: "Simulate file categorizations of internal disk sectors." },
      { id: "dup-document", name: "Duplicate Document Finder", category: "mobile-utilities", description: "Detect matching PDF/Doc payloads by file sizes or values." },
      { id: "battery-calc", name: "Battery Health Calculator", category: "mobile-utilities", description: "Analyze charge profiles to assess battery degeneration status." },
      { id: "imei-validator", name: "IMEI Validator", category: "mobile-utilities", description: "Validate correct Luhn checksum calculations of IMEI numbers." },
      { id: "device-properties", name: "Device Information Viewer", category: "mobile-utilities", description: "Read screen size ratios, layouts, useragents from browser context." },
      { id: "speed-test", name: "Speed Test", category: "mobile-utilities", description: "Simulates network latency and bandwidth capacities." }
    ]
  },
  {
    id: "database-schema",
    title: "Database Hub",
    icon: "Database",
    tools: [
      { id: "oracle-sqlserver", name: "Oracle → SQL Server", category: "database-schema", description: "Convert PL/SQL DDL formats cleanly to T-SQL.", isAiPowered: true },
      { id: "oracle-mysql", name: "Oracle → MySQL", category: "database-schema", description: "Convert PL/SQL configurations into MySQL formats.", isAiPowered: true },
      { id: "oracle-postgresql", name: "Oracle → PostgreSQL", category: "database-schema", description: "Transpose PL/SQL constraints to PostgreSQL schemas.", isAiPowered: true },
      { id: "oracle-db2", name: "Oracle → DB2", category: "database-schema", description: "Transpose Oracle dialects into AS400 DB2 syntaxes.", isAiPowered: true },
      { id: "sqlserver-oracle", name: "SQL Server → Oracle", category: "database-schema", description: "Transpose T-SQL triggers formats to PL/SQL layouts.", isAiPowered: true },
      { id: "sqlserver-mysql", name: "SQL Server → MySQL", category: "database-schema", description: "Convert SQL Server scripts into simple MySQL syntax.", isAiPowered: true },
      { id: "sqlserver-postgresql", name: "SQL Server → PostgreSQL", category: "database-schema", description: "Format T-SQL types directly to PostgreSQL standards.", isAiPowered: true },
      { id: "sqlserver-db2", name: "SQL Server → DB2", category: "database-schema", description: "Convert SQL Server tables to DB2 structures.", isAiPowered: true },
      { id: "mysql-oracle", name: "MySQL → Oracle", category: "database-schema", description: "Map MySQL tables structures to Oracle table constraints.", isAiPowered: true },
      { id: "mysql-sqlserver", name: "MySQL → SQL Server", category: "database-schema", description: "Migrate MySQL statements into SQL Server tables definitions.", isAiPowered: true },
      { id: "mysql-postgresql", name: "MySQL → PostgreSQL", category: "database-schema", description: "Tranpose MySQL declarations into PostgreSQL dialect.", isAiPowered: true },
      { id: "mysql-db2", name: "MySQL → DB2", category: "database-schema", description: "Convert raw MySQL schemas into DB2 definitions.", isAiPowered: true },
      { id: "db2-oracle", name: "DB2 → Oracle", category: "database-schema", description: "Extract DB2 tables definitions into Oracle queries.", isAiPowered: true },
      { id: "db2-sqlserver", name: "DB2 → SQL Server", category: "database-schema", description: "Transpose DB2 columns types into standard T-SQL columns.", isAiPowered: true },
      { id: "db2-mysql", name: "DB2 → MySQL", category: "database-schema", description: "Simplify DB2 layout constraints into MySQL parameters.", isAiPowered: true },
      { id: "db2-postgresql", name: "DB2 → PostgreSQL", category: "database-schema", description: "Translate IBM DB2 script configurations into PostgreSQL declarations.", isAiPowered: true },
      { id: "ddl-formatter", name: "DDL Formatter", category: "database-schema", description: "Assemble schema tables creation lines in readable indent layouts." },
      { id: "ddl-beautifier", name: "DDL Beautifier", category: "database-schema", description: "Format indices, views, triggers with aligned spacing clauses." },
      { id: "schema-compare", name: "Schema Compare", category: "database-schema", description: "Highlight column modifications or shifts between schemas inputs.", isAiPowered: true },
      { id: "table-compare", name: "Table Compare", category: "database-schema", description: "Verify type differences across multiple SQL tables configurations.", isAiPowered: true },
      { id: "index-compare", name: "Index Compare", category: "database-schema", description: "Diagnose discrepancies across indexes of two database files.", isAiPowered: true },
      { id: "constraint-compare", name: "Constraint Compare", category: "database-schema", description: "Audit unique, foreign, and primary keys mappings comparison.", isAiPowered: true },
      { id: "sql-migration-gen", name: "SQL Migration Script Generator", category: "database-schema", description: "Compile delta alteration SQL queries between versions details.", isAiPowered: true },
      { id: "sql-er-diagram", name: "SQL → ER Diagram", category: "database-schema", description: "Process raw DDL code to render structured ER relationship card diagrams.", isAiPowered: true },
      { id: "er-diagram-sql", name: "ER Diagram → SQL", category: "database-schema", description: "Translate graphical layout models definitions into clean DDL queries.", isAiPowered: true },
      { id: "db-doc-generator", name: "Database Documentation Generator", category: "database-schema", description: "Generate elegant Markdown dictionary files describing database structures.", isAiPowered: true }
    ]
  },
  {
    id: "data-transformation",
    title: "Data Transformation Hub",
    icon: "RefreshCw",
    tools: [
      { id: "json-xml", name: "JSON → XML", category: "data-transformation", description: "Map JSON properties directly to nested XML tags." },
      { id: "xml-json", name: "XML → JSON", category: "data-transformation", description: "Convert structured XML tags elements into JSON structures." },
      { id: "json-yaml", name: "JSON → YAML", category: "data-transformation", description: "Tranpose JSON attributes into indentation spacing YAML." },
      { id: "yaml-json", name: "YAML → JSON", category: "data-transformation", description: "Deconstruct YAML layout properties into a clean JSON output." },
      { id: "xml-yaml", name: "XML → YAML", category: "data-transformation", description: "Transpose XML layout markup lines into YAML formats." },
      { id: "yaml-xml", name: "YAML → XML", category: "data-transformation", description: "Convert spacing-based YAML configurations into XML tags tree." },
      { id: "csv-json", name: "CSV → JSON", category: "data-transformation", description: "Translate header-based CSV rows into standard JSON array maps." },
      { id: "json-csv", name: "JSON → CSV", category: "data-transformation", description: "Export flat JSON directories rows to downloadable CSV listings." },
      { id: "csv-xml", name: "CSV → XML", category: "data-transformation", description: "Form structured XML structures representing CSV list contents." },
      { id: "xml-csv", name: "XML → CSV", category: "data-transformation", description: "Convert repetitive XML listings grids into comma-separated columns." },
      { id: "excel-json", name: "Excel → JSON", category: "data-transformation", description: "Convert cell structures from excel copies into JSON mappings." },
      { id: "json-excel", name: "JSON → Excel", category: "data-transformation", description: "Compile flat object arrays into standard worksheets grids." },
      { id: "excel-csv", name: "Excel → CSV", category: "data-transformation", description: "Translate Excel table definitions into flat CSV text formats." },
      { id: "csv-excel", name: "CSV → Excel", category: "data-transformation", description: "Transpose lines of CSV characters into tab-separated spreadsheets." },
      { id: "properties-yaml", name: "Properties → YAML", category: "data-transformation", description: "Translate Flat Java properties layouts into nested YAML structures." },
      { id: "yaml-properties", name: "YAML → Properties", category: "data-transformation", description: "Compile indented YAML configuration files into flat Java property keys." },
      { id: "ini-json", name: "INI → JSON", category: "data-transformation", description: "Parse INI section headers patterns into mapped JSON fields." },
      { id: "toml-json", name: "TOML → JSON", category: "data-transformation", description: "Read standard TOML configs lines and print parsed JSON files." },
      { id: "json-toml", name: "JSON → TOML", category: "data-transformation", description: "Form TOML config structures parsing standard JSON elements." }
    ]
  },
  {
    id: "api-integration",
    title: "API & Integration Hub",
    icon: "Network",
    tools: [
      { id: "openapi-postman", name: "OpenAPI → Postman", category: "api-integration", description: "Construct Postman collections configurations out of OpenAPI files schemas.", isAiPowered: true },
      { id: "postman-openapi", name: "Postman → OpenAPI", category: "api-integration", description: "Compile standard JSON Postman requests listings to OpenAPI specifications.", isAiPowered: true },
      { id: "swagger-validator", name: "Swagger Validator", category: "api-integration", description: "Inspect syntax correctness of v2/v3 Swagger config outlines.", isAiPowered: true },
      { id: "openapi-validator", name: "OpenAPI Validator", category: "api-integration", description: "Check structural alignments of API declarations files.", isAiPowered: true },
      { id: "openapi-diff", name: "OpenAPI Diff", category: "api-integration", description: "Compare YAML outlines to isolate break modifications on routes details.", isAiPowered: true },
      { id: "wsdl-openapi", name: "WSDL → OpenAPI", category: "api-integration", description: "Translate SOAP WSDL models structures into OpenAPI definitions templates.", isAiPowered: true },
      { id: "soapxml-json", name: "SOAP XML → JSON", category: "api-integration", description: "Parse complex SOAP structures payloads into simple JSON components.", isAiPowered: true },
      { id: "curl-postman", name: "Curl → Postman", category: "api-integration", description: "Assemble direct Curl requests layouts in Postman formats.", isAiPowered: true },
      { id: "curl-python", name: "Curl → Python", category: "api-integration", description: "Generate Python requests code from cURL definitions.", isAiPowered: true },
      { id: "curl-java", name: "Curl → Java", category: "api-integration", description: "Generate Java HttpClient connections statements from Curl outlines.", isAiPowered: true },
      { id: "curl-nodejs", name: "Curl → NodeJS", category: "api-integration", description: "Generate Node.js fetch or axios queries blocks.", isAiPowered: true },
      { id: "curl-csharp", name: "Curl → C#", category: "api-integration", description: "Generate C# RestClient code structures from Curl lines.", isAiPowered: true },
      { id: "graphql-formatter", name: "GraphQL Formatter", category: "api-integration", description: "Beautify spacing alignment of GraphQL queries and schemas strings." },
      { id: "graphql-schema-viewer", name: "GraphQL Schema Viewer", category: "api-integration", description: "Browse trees schemas details in a visual cards inspector component." },
      { id: "graphql-rest", name: "GraphQL → REST Converter", category: "api-integration", description: "Formulate equivalent Express/REST endpoints patterns out of GraphQL models.", isAiPowered: true }
    ]
  },
  {
    id: "enterprise-modernization",
    title: "Enterprise Modernization Hub",
    icon: "Binary",
    tools: [
      { id: "cobol-json", name: "COBOL Copybook → JSON", category: "enterprise-modernization", description: "Deconstruct IBM COBOL data copybook layouts into usable JSON models.", isAiPowered: true },
      { id: "cobol-xml", name: "COBOL Copybook → XML", category: "enterprise-modernization", description: "Translate rigid COBOL ledger tables templates to nested XML blocks.", isAiPowered: true },
      { id: "cobol-parser", name: "COBOL Copybook Parser", category: "enterprise-modernization", description: "Parse byte-sizes offsets and data types specifications of copybook assets.", isAiPowered: true },
      { id: "ebcdic-ascii", name: "EBCDIC → ASCII", category: "enterprise-modernization", description: "Convert legacy Ebcdic mainframes byte formats into modern readable ASCII strings.", isAiPowered: true },
      { id: "fixedwidth-csv", name: "Fixed Width → CSV", category: "enterprise-modernization", description: "Parse character offsets-based flat files into clean CSV lines.", isAiPowered: true },
      { id: "fixedwidth-json", name: "Fixed Width → JSON", category: "enterprise-modernization", description: "Isolate character-delimited entries columns into structured JSON elements.", isAiPowered: true },
      { id: "xsd-jsonschema", name: "XSD → JSON Schema", category: "enterprise-modernization", description: "Transpose legacy XML Schema Definition structures to modern standard JSON parameters.", isAiPowered: true },
      { id: "jsonschema-xsd", name: "JSON Schema → XSD", category: "enterprise-modernization", description: "Generate XML Schema formats capturing parameters definitions of JSON models.", isAiPowered: true },
      { id: "avro-jsonschema", name: "Avro → JSON Schema", category: "enterprise-modernization", description: "Format Apache Avro record definitions into AJV-compliant JSON schemas.", isAiPowered: true },
      { id: "protobuf-jsonschema", name: "Protobuf → JSON Schema", category: "enterprise-modernization", description: "Translate Proto3 contracts files definitions into web-consumable JSON schemas.", isAiPowered: true }
    ]
  }
];

export const ALL_TOOLS: Tool[] = CATEGORIES.reduce((acc, cat) => {
  return [...acc, ...cat.tools];
}, [] as Tool[]);
