# How to Check In All Local Changes to a New Branch

1. **Check your current status**
   ```sh
   git status
   ```

2. **Stage all changes**
   ```sh
   git add .
   ```

3. **Create a new branch**
   ```sh
   git checkout -b your-feature-branch-name
   ```

4. **Commit your changes**
   ```sh
   git commit -m "Describe your changes"
   ```

5. **Push the new branch to remote**
   ```sh
   git push origin your-feature-branch-name
   ```

6. **(Optional) Create a Pull Request on GitHub/GitLab/etc**

---

**Tip:**  
Replace `your-feature-branch-name` with a meaningful branch name (e.g., `api-refactor`, `bugfix/relations-id`, etc).
