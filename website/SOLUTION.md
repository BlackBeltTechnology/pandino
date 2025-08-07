# Solution to Static Files Glob Error

## Original Issue
The build process was failing with the following error:
```
ERROR
unable to locate '/Users/noherczeg/projects/pandino/website/static/**/*' glob
```

## Root Cause
The error occurred because the glob pattern was looking for files in the static directory and its subdirectories, but there were no actual files to match. The static directory structure existed (`/website/static/img/`), but it was completely empty.

Docusaurus expects at least one file to exist in the static directory structure for the build process to work correctly. The configuration file (`docusaurus.config.js`) references several static files that should be in the `img` directory:
- `favicon.ico` (line 8)
- `docusaurus-social-card.jpg` (line 62)
- `logo.svg` (line 67)

## Solution Implemented
To fix the issue, we created placeholder files in the static directory:
1. Created a `.gitkeep` file in the `img` directory to ensure the directory is tracked by git
2. Created a `README.md` file in the `img` directory with information about the required image files

These files ensure that the glob pattern can find at least one file in the static directory, which resolves the original error.

## Verification
After implementing the solution, the build process no longer shows the error about the static glob pattern. This confirms that our fix for the original issue was successful.

## Additional Issues
During testing, we discovered additional issues with the build process:
- There are broken links in the documentation, particularly links to the root path ("/") and some LICENSE.txt files
- These broken links issues are separate from the original static files problem and would need to be addressed separately

## Next Steps
To fully fix the website build, the following steps would be needed:
1. Add the actual image files referenced in the configuration:
   - favicon.ico
   - logo.svg
   - docusaurus-social-card.jpg
2. Fix the broken links in the documentation
3. Update the configuration as needed to resolve any remaining issues
