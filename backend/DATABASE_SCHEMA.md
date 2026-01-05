# Database Schema Documentation

## Overview
This application uses a microservices architecture with two separate MongoDB databases:

1. **authentication** database (Auth Service)
2. **todo** database (Todo Service)

## Schema Relationships

### Cross-Database Relationships

#### User ← Plan (Cross-database)
- **Database**: `authentication` ← `todo`
- **Type**: One-to-Many
- **Implementation**: 
  - `Plan.userId` references `User._id`
  - Uses `mongoose.Schema.Types.ObjectId` with `ref: 'User'`
- **Description**: Each Plan belongs to one User. A User can have multiple Plans.

#### Plan ← Task (Same database)
- **Database**: `todo` ← `todo`
- **Type**: One-to-Many
- **Implementation**:
  - `Task.planID` references `Plan._id`
  - Uses `mongoose.Schema.Types.ObjectId` with `ref: 'Plan'`
- **Description**: Each Task belongs to one Plan. A Plan can have multiple Tasks.

## Schema Details

### User Schema (authentication database)
Located in: `backend/services/auth/src/models/user.model.js`

```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (required, minlength: 10)
}
```

### Plan Schema (todo database)
Located in: `backend/services/todo_app/src/models/plan.model.js`

```javascript
{
  _id: ObjectId,
  name: String (required),
  userId: ObjectId (required, ref: 'User'),  // References User in authentication DB
  status: String (enum: ['active', 'inactive'], default: 'active'),
  createdAt: Date (timestamp),
  updatedAt: Date (timestamp)
}
```

### Task Schema (todo database)
Located in: `backend/services/todo_app/src/models/task.model.js`

```javascript
{
  _id: ObjectId,
  planID: ObjectId (required, ref: 'Plan'),  // References Plan in same DB
  name: String (required),
  startDate: Date,
  endDate: Date,
  status: String (enum: ['not started', 'in_process', 'done'], default: 'not started'),
  note: String (maxlength: 300),
  createdAt: Date (timestamp),
  updatedAt: Date (timestamp)
}
```

## How the System Works

### Authentication Flow
1. User authenticates through Auth Service (`authentication` database)
2. JWT token is generated containing `userId`
3. Token is verified by `auth.middleware.js` in subsequent requests

### Plan-User Relationship
1. When creating a Plan, the `userId` from the authenticated user (JWT token) is stored
2. The `userId` field in Plan schema references the User model with `ref: 'User'`
3. Mongoose supports cross-database references when both connections use the same MongoDB instance
4. Plans are filtered by `userId` to ensure users only see their own plans

### Task-Plan Relationship
1. When creating a Task, the `planID` references a Plan in the same database
2. Tasks are associated with Plans, which are in turn associated with Users
3. This creates an indirect User → Plan → Task relationship chain

## Usage Examples

### Populating User Information in Plans
```javascript
// If needed, you can populate the user information across databases
const plans = await Plan.find({ userId }).populate('userId', 'name email');
```

### Populating Plan Information in Tasks
```javascript
// Populate plan details when retrieving tasks
const tasks = await Task.find({ planID }).populate('planID', 'name status');
```

### Getting All Data for a User
```javascript
// Get user's plans with tasks
const plans = await Plan.find({ userId }).populate('userId', 'name email');
const planIds = plans.map(p => p._id);
const tasks = await Task.find({ planID: { $in: planIds } }).populate('planID');
```

## Important Notes

1. **Cross-Database References**: Mongoose supports references across databases when they're on the same MongoDB connection string. Both services connect to the same MongoDB instance but use different database names.

2. **Validation**: The `userId` in Plan is validated through the auth middleware, ensuring only authenticated users can create plans associated with their account.

3. **Isolation**: Each service maintains its own database for data isolation and microservices best practices.

4. **Consistency**: When deleting users, consider implementing cascade deletion or orphan handling for associated Plans and Tasks.
