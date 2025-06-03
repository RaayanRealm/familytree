# Debugging `relative.id` in MemberProfile

## 1. Inspect the Data in Browser

- Open your app in the browser.
- Open DevTools (F12 or right-click → Inspect).
- Go to the "Components" tab (React Developer Tools).
- Find `<MemberProfile />` in the component tree.
- Look at the `relations` prop/state. Expand each item to see what fields are present (`id`, `relative_id`, etc).

## 2. Add a Console Log

In `MembersProfile.jsx`, before rendering the relations list, add:

```javascript
console.log("relations", relations);
```

This will print the array to the browser console so you can see the structure and field names.

## 3. Check the API Response

- In DevTools, go to the "Network" tab.
- Reload the page for a member.
- Find the request to `/api/family/relationships/:id`.
- Click it, then look at the "Response" tab.
- See what each relation object looks like (does it have `id`, `relative_id`, etc).

## 4. Trace the Data Flow

- If `relative.id` is wrong, check if you should use `relative.relative_id` instead.
- Update your render code to use the correct field:
  ```javascript
  const relId = relative.relative_id || relative.id;
  ```

## 5. If Needed, Fix the Backend

- If the API is not returning the correct `relative_id`, check your backend DTO/service code.
- Make sure the backend returns both `id` (relationship id) and `relative_id` (person id of the relative).

---

**Summary:**  
- Use React DevTools to inspect component state/props.
- Use browser console and network tab to inspect API responses.
- Add `console.log` in your component to see the data shape.
- Adjust your code to use the correct field (`relative_id`).
