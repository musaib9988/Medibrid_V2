import fs from 'fs';

let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// 1. Add useRef to imports
content = content.replace(
  "import React, { createContext, useContext, useState, useEffect } from 'react';",
  "import React, { createContext, useContext, useState, useEffect, useRef } from 'react';"
);

// 2. Fix vibrate on NotificationOptions by casting to any
content = content.replace(/new Notification\(title, \{(.*?)\}\)/g, "new Notification(title, {$1} as any)");

// 3. Fix the "An expression of type 'void' cannot be tested for truthiness" at line 1460 
// Let's find where it is.
fs.writeFileSync('src/context/AppContext.tsx', content);

