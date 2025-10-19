const DatabaseConnection = require('./connection');

class UserRepository {
  constructor() {
    this.db = new DatabaseConnection();
  }

  // DB-FindUserByUsername: 根据用户名查询用户信息
  async findUserByUsername(loginId) {
    // TODO: 实现根据用户名/邮箱/手机号查询用户信息
    // 验收标准：
    // - 成功查询到用户时，返回完整的用户信息记录
    // - 用户不存在时，返回空结果
    // - 支持用户名、邮箱格式、手机号格式的输入识别
    throw new Error('findUserByUsername not implemented');
  }

  // DB-VerifyUserPassword: 验证用户密码是否正确
  async verifyUserPassword(userId, password) {
    // TODO: 实现密码验证逻辑
    // 验收标准：
    // - 密码匹配时返回验证成功
    // - 密码不匹配时返回验证失败
    // - 支持加密密码的比对验证
    throw new Error('verifyUserPassword not implemented');
  }

  // DB-VerifyUserIdCard: 验证用户证件号后4位是否正确
  async verifyUserIdCard(userId, idCardLast4) {
    // TODO: 实现证件号后4位验证逻辑
    // 验收标准：
    // - 证件号后4位匹配时返回验证成功
    // - 证件号后4位不匹配时返回验证失败
    // - 输入必须为4位数字
    throw new Error('verifyUserIdCard not implemented');
  }

  // DB-GetUserPhoneNumber: 获取用户绑定的手机号码
  async getUserPhoneNumber(userId) {
    // TODO: 实现获取用户手机号逻辑
    // 验收标准：
    // - 成功返回用户绑定的手机号码
    // - 用户不存在时返回空结果
    // - 手机号码格式为11位数字
    throw new Error('getUserPhoneNumber not implemented');
  }

  // DB-UpdateUserLoginTime: 更新用户最后登录时间
  async updateUserLoginTime(userId, loginInfo) {
    // TODO: 实现更新用户登录时间逻辑
    // 验收标准：
    // - 成功更新用户的最后登录时间为当前时间
    // - 记录登录IP地址和设备信息
    // - 更新操作必须原子性执行
    throw new Error('updateUserLoginTime not implemented');
  }
}

module.exports = UserRepository;