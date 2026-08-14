import fs from 'fs';

let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Use a regex that matches the block starting from <input type="file" up to its closing tag or up to reader.readAsDataURL(file);
const regex = /<input\s+type="file"\s+accept="image\/\*"\s+className="hidden"\s+onChange=\{\(e\)\s*=>\s*\{\s*const\s+file\s*=\s*e\.target\.files\?\.\[0\];\s*if\s*\(file\)\s*\{\s*const\s+reader\s*=\s*new\s+FileReader\(\);\s*reader\.onloadend\s*=\s*\(\)\s*=>\s*\{\s*if\s*\(typeof\s+reader\.result\s*===\s*'string'\)\s*\{\s*setNewBanner\(prev\s*=>\s*\(\{\s*\.\.\.prev,\s*imageUrl:\s*reader\.result\s*as\s*string\s*\}\)\);\s*\}\s*\};\s*reader\.readAsDataURL\(file\);\s*\}\s*\}\}\s*\/>/;

const replacement = `<input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    if (typeof reader.result === 'string') {
                                      const img = new Image();
                                      img.src = reader.result;
                                      img.onload = () => {
                                        const canvas = document.createElement('canvas');
                                        const MAX_WIDTH = 800;
                                        const MAX_HEIGHT = 800;
                                        let width = img.width;
                                        let height = img.height;

                                        if (width > height) {
                                          if (width > MAX_WIDTH) {
                                            height *= MAX_WIDTH / width;
                                            width = MAX_WIDTH;
                                          }
                                        } else {
                                          if (height > MAX_HEIGHT) {
                                            width *= MAX_HEIGHT / height;
                                            height = MAX_HEIGHT;
                                          }
                                        }

                                        canvas.width = width;
                                        canvas.height = height;
                                        const ctx = canvas.getContext('2d');
                                        if (ctx) {
                                          ctx.drawImage(img, 0, 0, width, height);
                                          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
                                          setNewBanner(prev => ({ ...prev, imageUrl: compressedDataUrl }));
                                        } else {
                                          setNewBanner(prev => ({ ...prev, imageUrl: reader.result as string }));
                                        }
                                      };
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/components/AdminPanel.tsx', code);
  console.log("Replaced successfully");
} else {
  console.log("Regex did not match");
}
