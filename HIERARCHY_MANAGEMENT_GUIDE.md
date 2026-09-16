# Hierarchy Management — Admin Quick Guide

## Visual Layout

### Sidebar with Hierarchy Section

```
┌─────────────────────────────────────┐
│  [ARITII LOGO]                      │
├─────────────────────────────────────┤
│  Navigation Groups:                 │
│  ├─ Dashboard                       │
│  ├─ Users                           │
│  ├─ Businesses & Shops              │
│  ├─ Locations & Expansion           │
│  ├─ Commerce                        │
│  ├─ Delivery                        │
│  └─ ... (scrollable)                │
├─────────────────────────────────────┤
│ 📍 Platform Hierarchy  [+]      [▾] │  ← EXPANDED
├─────────────────────────────────────┤
│ Search hierarchy...     🔍           │
│                                     │
│ 🌍 East Africa           ▶ [+] ✏️ 🗑️ │
│  └─ 🏙️ Nairobi           ▶ [+] ✏️ 🗑️ │
│     └─ 📍 Westlands      ▶ [+] ✏️ 🗑️ │
│        └─ 🛒 Quick Commerce ▶ [+] ✏️ 🗑️
│           ├─ 🏪 FreshMart   ▶ [+] ✏️ 🗑️
│           │  └─ 🏬 Westlands Shop [+] ✏️ 🗑️
│           └─ 🏪 Jumia Fresh  [+] ✏️ 🗑️
│                                     │
└─────────────────────────────────────┘

Legend:
🌍 = Region    🏙️ = City    📍 = Area    🛒 = Sector
🏪 = Business  🏬 = Shop    [+] = Add    ✏️ = Edit
🗑️ = Delete    ▶ = Collapsed  ▾ = Expanded
```

---

## Step-by-Step: Creating a Region

### 1. Click the [+] Button
```
Click: 📍 Platform Hierarchy  [+]  ← Click this button
```

### 2. Modal Appears
```
┌─────────────────────────────────────┐
│  Create Region                      │
├─────────────────────────────────────┤
│  Name *                             │
│  [_____________________]            │
│  E.g., East Africa                  │
│                                     │
│  Code (optional)                    │
│  [_________]                        │
│  E.g., EA                           │
│                                     │
│  Description (optional)             │
│  ┌─────────────────────────┐        │
│  │                         │        │
│  │ Add context here...     │        │
│  │                         │        │
│  └─────────────────────────┘        │
├─────────────────────────────────────┤
│  [Cancel]  [Create]                 │
└─────────────────────────────────────┘
```

### 3. Fill Form
```
Name:        East Africa
Code:        EA
Description: Main distribution hub for Kenya, Tanzania, Uganda
```

### 4. Click Create
```
Toast: ✓ Region created successfully
```

### 5. Tree Updates
```
✓ Now visible in tree:
  🌍 East Africa [+] ✏️ 🗑️
```

---

## Step-by-Step: Creating Under Existing Node

### 1. Hover Over Node
```
Move mouse to:  🌍 East Africa [+] ✏️ 🗑️
                              ↑
```

### 2. See Actions Appear
```
On hover:  🌍 East Africa [+] ✏️ 🗑️
                           ↑↑ ↑ ↑
                    Add Edit Delete
```

### 3. Click [+] to Add Child
```
Modal opens: Create City
             Under Region: East Africa
```

### 4. Fill Details
```
Name:        Nairobi
Code:        NBO
Description: Capital city, main market
```

### 5. Click Create
```
Tree updates:
  🌍 East Africa         [+] ✏️ 🗑️
   └─ 🏙️ Nairobi        [+] ✏️ 🗑️  ← New
```

---

## Hierarchy Structure Explained

```
Level 1: Region (e.g., East Africa, West Africa)
   │
   └─ Level 2: City (e.g., Nairobi, Lagos, Kampala)
       │
       └─ Level 3: Area (e.g., Westlands, Central Business District)
           │
           └─ Level 4: Sector (e.g., Quick Commerce, Restaurants, Pharmacy)
               │
               └─ Level 5: Business (e.g., FreshMart Ltd, Jumia)
                   │
                   └─ Level 6: Shop (e.g., FreshMart Westlands, FreshMart CBD)

Each level must have a parent (except Region, which is top-level).
```

---

## Search Example

### 1. Type in Search
```
┌──────────────────────────┐
│ Search hierarchy...  🔍   │
│ [nair_________________]   │  ← Typing "Nair"
└──────────────────────────┘
```

### 2. Tree Filters Automatically
```
Showing results for "Nair":

  🌍 East Africa
   └─ 🏙️ Nairobi  ✏️ 🗑️       ← Match!
      └─ 📍 Westlands
         └─ 🛒 Quick Commerce
            ├─ 🏪 FreshMart
            │  └─ 🏬 Westlands Shop
            └─ 🏪 Jumia Fresh
```

### 3. Clear Search
```
Delete text → Tree shows all nodes again
```

---

## Editing a Node

### 1. Hover and Click Edit
```
🌍 East Africa [+] ✏️ 🗑️
              Click: ✏️
```

### 2. Modal Opens with Current Values
```
┌─────────────────────────────────────┐
│  Edit Region                        │
│  ID: region-xyz123                  │
├─────────────────────────────────────┤
│  Name *                             │
│  [East Africa___________]           │
│                                     │
│  Code (optional)                    │
│  [EA_________]                      │
│                                     │
│  Description (optional)             │
│  ┌─────────────────────────┐        │
│  │ Main distribution hub   │        │
│  │ for Kenya, Tanzania,    │        │
│  │ Uganda                  │        │
│  └─────────────────────────┘        │
│                                     │
│  ☑ Active                           │
├─────────────────────────────────────┤
│  [Cancel]  [Update]                 │
└─────────────────────────────────────┘
```

### 3. Make Changes
```
Change: Description → "East Africa Hub (Active)"
Change: Active ☑ → ☐ (Deactivate)
```

### 4. Click Update
```
Toast: ✓ Node updated successfully
```

---

## Deleting a Node

### 1. Hover and Click Delete
```
🏙️ Nairobi [+] ✏️ 🗑️
           Click: 🗑️
```

### 2. Confirmation Dialog
```
Are you sure? This may cascade to child nodes.

Children will be:
  • Deleted (recommended)
  • Moved to parent (if configurable)

[Cancel]  [Confirm Delete]
```

### 3. Confirm
```
Tree updates:
  🌍 East Africa  [+] ✏️ 🗑️
  (No children)
```

---

## Permission Error

If you're not SUPER_ADMIN:

```
Error Toast: ⚠️ Only super admins can manage hierarchy
```

The [+], ✏️, 🗑️ buttons will be hidden for non-super admins.

---

## Common Tasks

### Organize a New Market (Country)
1. Click [+] next to "Platform Hierarchy"
2. Create Region: "West Africa"
3. Hover West Africa, click [+]
4. Create Cities: "Lagos", "Accra", "Abuja"
5. Under each City, create Areas
6. Under each Area, create Sectors
7. Under each Sector, create Businesses
8. Under each Business, create Shops

### Move a Business to Different Sector
1. (Hover Business, click ✏️)  
2. *Backend feature: Select new parent*
3. Save

### Deactivate a Region
1. Hover Region, click ✏️
2. Uncheck "Active" checkbox
3. Click "Update"
4. Deactivates that region (children may still be active)

### Search for All Shops in a City
1. Type city name in search: "Nair"
2. All matching Shops appear in filtered tree

---

## Support

- **Cannot edit?** You're not a SUPER_ADMIN. Contact admin.
- **Lost changes?** Refresh page to reload from server.
- **Tree not loading?** Check internet connection, refresh page.
- **Delete cascaded unexpectedly?** Deleted node and all children. This is expected.

