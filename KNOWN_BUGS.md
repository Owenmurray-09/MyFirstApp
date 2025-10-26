# Known Bugs & Issues

## Profile Page Issues

### 🐛 Edit Form Pre-population Bug
**Issue:** On first visit to `/profile`, clicking "Edit Profile" shows placeholder text instead of saved database values. Works correctly on second attempt.

**Steps to Reproduce:**
1. Navigate to `http://localhost:8081/profile`
2. Click "Edit Profile" on first try
3. Form fields show placeholder text instead of saved data
4. Click "Cancel" then "Edit Profile" again
5. Form fields now correctly show saved data

**Root Cause:** React state timing issue between profile loading and form initialization

**Status:** Needs investigation - likely needs different approach to form state management

**Workaround:** Click Cancel and Edit Profile again

---

*Last updated: 2025-09-15*