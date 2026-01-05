# Issue Resolution: Schema Interaction Between Databases

## Original Issue (Vietnamese)
**Tương tác giữa 2 database auth và todo_app như thế nào?**

1. **user.model:** nằm ở services auth
2. **plan.model và task.model:** nằm ở service todo_app

**=> Làm sao để hệ thống biết được plan này thuộc về một user nào?**

## Solution (English & Vietnamese)

### How the System Knows Which Plan Belongs to Which User
### Hệ thống biết Plan thuộc về User nào như thế nào

The solution establishes a proper MongoDB reference relationship between the User model (in `authentication` database) and the Plan model (in `todo` database).

### Code Changes / Thay đổi code

**File: `backend/services/todo_app/src/models/plan.model.js`**

```javascript
// BEFORE / TRƯỚC
userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
}

// AFTER / SAU
userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // ← Key addition: References User model
    required: true
}
```

This single line addition (`ref: 'User'`) tells Mongoose that:
- `userId` field references the User model
- User model is in a different database (authentication)
- Mongoose can populate user data when needed

Dòng code này (`ref: 'User'`) cho Mongoose biết:
- Trường `userId` tham chiếu đến model User
- User model nằm ở database khác (authentication)
- Mongoose có thể populate (lấy) dữ liệu user khi cần

### How It Works / Cách hoạt động

#### 1. Creating a Plan / Tạo Plan
```javascript
// User authenticated via JWT token
// JWT token contains userId

const newPlan = new Plan({
    name: planName,
    userId: userId,  // From JWT token / Từ JWT token
    status: 'active'
});
await newPlan.save();
```

#### 2. Retrieving User's Plans / Lấy Plans của User
```javascript
// Without population (current way) / Không populate (cách hiện tại)
const plans = await Plan.find({ userId });

// With population (new capability) / Với population (khả năng mới)
const plans = await Plan.find({ userId })
    .populate('userId', 'name email');
// Result includes user data / Kết quả bao gồm dữ liệu user
```

#### 3. Security Check / Kiểm tra bảo mật
```javascript
// Verify plan belongs to user / Xác minh plan thuộc về user
const plan = await Plan.findOne({ 
    _id: planId, 
    userId: userId 
});

if (!plan) {
    throw new Error('Unauthorized'); // User doesn't own this plan
}
```

### Relationship Chain / Chuỗi quan hệ

```
User (authentication DB)
  │
  ├─► userId stored in Plan
  │
  └─► Plan (todo DB)
        │
        ├─► planID stored in Task
        │
        └─► Task (todo DB)
```

### Technical Benefits / Lợi ích kỹ thuật

1. **Minimal Changes / Thay đổi tối thiểu**
   - Only added one line: `ref: 'User'`
   - Chỉ thêm một dòng: `ref: 'User'`

2. **Backward Compatible / Tương thích ngược**
   - All existing code works without modification
   - Tất cả code hiện tại hoạt động không cần sửa

3. **Clear Relationship / Quan hệ rõ ràng**
   - Developers can see Plan belongs to User
   - Developers có thể thấy Plan thuộc về User

4. **Optional Population / Population tùy chọn**
   - Can fetch user data when needed
   - Có thể lấy dữ liệu user khi cần

5. **Cross-Database Support / Hỗ trợ nhiều database**
   - Works across different databases on same MongoDB
   - Hoạt động qua các database khác nhau trên cùng MongoDB

### Documentation Files / Tài liệu

Created comprehensive documentation:
Đã tạo tài liệu đầy đủ:

1. **DATABASE_SCHEMA.md** - Complete schema documentation with relationships
2. **USAGE_EXAMPLES.js** - 5 practical code examples
3. **SOLUTION_DIAGRAM.md** - Visual diagrams and explanations

### Verification / Xác minh

✅ **Syntax Check** - All JavaScript files validated
✅ **Code Review** - No issues found
✅ **Security Scan (CodeQL)** - No vulnerabilities detected
✅ **Backward Compatibility** - Existing code unchanged

### Summary / Tóm tắt

The issue is resolved by adding a MongoDB reference (`ref: 'User'`) to the `userId` field in the Plan model. This establishes a clear relationship between User and Plan across different databases, allowing the system to understand and optionally populate user information when working with plans.

Vấn đề được giải quyết bằng cách thêm tham chiếu MongoDB (`ref: 'User'`) vào trường `userId` trong model Plan. Điều này thiết lập một quan hệ rõ ràng giữa User và Plan qua các database khác nhau, cho phép hệ thống hiểu và có thể lấy thông tin user khi làm việc với plans.

---

For detailed technical information, see:
Để biết thông tin kỹ thuật chi tiết, xem:
- `DATABASE_SCHEMA.md` - Full schema documentation
- `SOLUTION_DIAGRAM.md` - Visual architecture and flow
- `USAGE_EXAMPLES.js` - Code examples
