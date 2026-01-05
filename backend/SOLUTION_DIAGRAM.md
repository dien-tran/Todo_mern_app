# Schema Interaction Solution - Visual Explanation

## Problem Statement (Vietnamese)
**Tương tác giữa 2 database auth và todo_app như thế nào?**
- user.model: nằm ở services auth
- plan.model và task.model: nằm ở service todo_app
- **Làm sao để hệ thống biết được plan này thuộc về một user nào?**

## Solution Overview (English)

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     MongoDB Instance                         │
├──────────────────────────────┬──────────────────────────────┤
│   Database: authentication   │   Database: todo             │
├──────────────────────────────┼──────────────────────────────┤
│                              │                              │
│  ┌────────────────────┐      │  ┌────────────────────┐     │
│  │  User Collection   │      │  │  Plan Collection   │     │
│  ├────────────────────┤      │  ├────────────────────┤     │
│  │ _id: ObjectId      │◄─────┼──│ userId: ObjectId   │     │
│  │ name: String       │  ref │  │   ref: 'User'      │     │
│  │ email: String      │      │  │ name: String       │     │
│  │ password: String   │      │  │ status: String     │     │
│  └────────────────────┘      │  └──────────┬─────────┘     │
│                              │             │                │
│                              │             │ ref            │
│                              │             │                │
│                              │  ┌──────────▼─────────┐     │
│                              │  │  Task Collection   │     │
│                              │  ├────────────────────┤     │
│                              │  │ planID: ObjectId   │     │
│                              │  │   ref: 'Plan'      │     │
│                              │  │ name: String       │     │
│                              │  │ status: String     │     │
│                              │  │ startDate: Date    │     │
│                              │  │ endDate: Date      │     │
│                              │  └────────────────────┘     │
└──────────────────────────────┴──────────────────────────────┘
```

### Data Flow

#### 1. User Authentication
```
Client → Auth Service → JWT Token (contains userId)
```

#### 2. Creating a Plan
```
Client Request:
  Headers: { Authorization: "Bearer <JWT>" }
  Body: { planName: "My Plan" }
    ↓
Auth Middleware verifies token and extracts userId
    ↓
Plan Controller creates Plan:
  {
    name: "My Plan",
    userId: <userId from JWT>,  ← This links Plan to User
    status: "active"
  }
    ↓
Saved to todo database
```

#### 3. Retrieving Plans
```
Client Request:
  Headers: { Authorization: "Bearer <JWT>" }
    ↓
Auth Middleware extracts userId
    ↓
Query: Plan.find({ userId: <userId> })
    ↓
Returns only plans belonging to this user
```

### The Key Change

**BEFORE** (Missing reference):
```javascript
userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
}
```
❌ System stores userId but doesn't know it references User model
❌ Cannot use .populate('userId') to fetch user data

**AFTER** (With reference):
```javascript
userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // ← Added this line
    required: true
}
```
✅ System knows userId references User model in authentication database
✅ Can use .populate('userId') to fetch user data across databases
✅ Clear relationship for developers and tools

## How the System Knows Which Plan Belongs to Which User

### Method 1: Direct Query (Already implemented)
```javascript
// Filter plans by userId
const plans = await Plan.find({ userId: req.user.userId });
```
This ensures users only see their own plans.

### Method 2: Population (New capability)
```javascript
// Get plan with user details
const plan = await Plan.findById(planId)
    .populate('userId', 'name email');

// Result:
{
  _id: "6789...",
  name: "My Plan",
  userId: {              // ← User data populated from auth DB
    _id: "1234...",
    name: "John Doe",
    email: "john@example.com"
  },
  status: "active"
}
```

### Method 3: Security Verification
```javascript
// Verify plan belongs to user before operations
const plan = await Plan.findOne({ 
    _id: planId, 
    userId: userId 
});

if (!plan) {
    throw new Error('Plan not found or unauthorized');
}
```

## Complete Relationship Chain

```
User (auth DB)
  └── has many → Plan (todo DB)
                   └── has many → Task (todo DB)
```

**Query Example:**
```javascript
// Get user's plans
const plans = await Plan.find({ userId: '12345...' });

// Get tasks for those plans
const planIds = plans.map(p => p._id);
const tasks = await Task.find({ planID: { $in: planIds } });
```

## Benefits of This Solution

1. **Minimal Changes**: Only added `ref: 'User'` to existing field
2. **Backward Compatible**: All existing code continues to work
3. **Clear Documentation**: Developers understand the relationship
4. **Future-Proof**: Enables data population when needed
5. **Best Practices**: Follows Mongoose reference patterns
6. **Security**: Maintains existing authentication and authorization

## Technical Notes

- Both services connect to the same MongoDB instance
- Different database names: `authentication` and `todo`
- Mongoose supports cross-database references in this setup
- The `ref` field tells Mongoose where to look for the referenced document
- Population works across databases on the same MongoDB instance
