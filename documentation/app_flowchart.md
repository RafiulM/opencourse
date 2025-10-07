flowchart TD
  A[Start]
  B[Submit login\n credentials]
  C[Auth Service\n receives request]
  D[Validate credentials\n against DB]
  E{Credentials valid?}
  F[Generate token\n and response]
  G[Fetch courses\n from CourseService]
  H[Retrieve courses\n from DB]
  I[Return course\n list to client]
  J[Send error\n response]
  K[End]

  A --> B
  B --> C
  C --> D
  D --> E
  E -->|Yes| F
  F --> G
  G --> H
  H --> I
  I --> K
  E -->|No| J
  J --> K