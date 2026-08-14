import fs from 'fs';
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

code = code.replace(
  '  const requestPermissions = async () => {\n    if (!firebaseUser) return;\n    await requestPermissionsAndSave(firebaseUser.uid, setUserProfile, true);\n  };',
  `  const requestPermissions = async () => {
    // If not logged in, pass empty string to still trigger location check
    const updates = await requestPermissionsAndSave(firebaseUser?.uid || '', setUserProfile, false);
    if (updates && (updates as any).district) {
      setUserLocationDistrict((updates as any).district);
    }
  };`
);

// Also we need to make requestPermissionsAndSave return updates
code = code.replace(
  '  // Save if any updates\n  if (Object.keys(updates).length > 0) {',
  `  // Save if any updates
  if (Object.keys(updates).length > 0) {`
);

// Let's just make it return updates at the end
code = code.replace(
  '    } catch (e) {\n      console.warn("Could not save permissions to profile:", e);\n    }\n  }\n};',
  `    } catch (e) {
      console.warn("Could not save permissions to profile:", e);
    }
  }
  return updates;
};`
);

fs.writeFileSync('src/context/AppContext.tsx', code);
