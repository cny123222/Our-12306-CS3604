/**
 * 注册控制器
 * 文件：backend/src/controllers/registerController.js
 * 
 * 处理所有注册相关的业务逻辑
 */

const registrationDbService = require('../services/registrationDbService');
const sessionService = require('../services/sessionService');
const { v4: uuidv4 } = require('uuid');

class RegisterController {
  /**
   * 验证用户名
   */
  async validateUsername(req, res) {
    try {
      const { username } = req.body;

      // 验证用户名长度
      if (!username || username.length < 6) {
        return res.status(400).json({
          valid: false,
          error: '用户名长度不能少于6个字符！'
        });
      }

      if (username.length > 30) {
        return res.status(400).json({
          valid: false,
          error: '用户名长度不能超过30个字符！'
        });
      }

      // 验证用户名格式：必须以字母开头，只能包含字母、数字和下划线
      const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({
          valid: false,
          error: '用户名只能由字母、数字和_组成，须以字母开头！'
        });
      }

      // 检查用户名是否已存在
      const existingUser = await registrationDbService.findUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({
          valid: false,
          error: '该用户名已经被占用，请重新选择用户名！'
        });
      }

      res.status(200).json({
        valid: true,
        message: '用户名可用'
      });
    } catch (error) {
      console.error('Validate username error:', error);
      res.status(500).json({
        valid: false,
        error: '服务器错误'
      });
    }
  }

  /**
   * 验证密码
   */
  async validatePassword(req, res) {
    try {
      const { password } = req.body;

      // 验证密码长度
      if (!password || password.length < 6) {
        return res.status(400).json({
          valid: false,
          error: '密码长度不能少于6个字符！'
        });
      }

      // 验证密码只包含字母、数字和下划线
      const passwordRegex = /^[a-zA-Z0-9_]+$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          valid: false,
          error: '格式错误，必须且只能包含字母、数字和下划线中的两种或两种以上！'
        });
      }

      // 验证密码必须包含至少两种字符类型
      const hasLetter = /[a-zA-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasUnderscore = /_/.test(password);
      const typeCount = (hasLetter ? 1 : 0) + (hasNumber ? 1 : 0) + (hasUnderscore ? 1 : 0);

      if (typeCount < 2) {
        return res.status(400).json({
          valid: false,
          error: '格式错误，必须且只能包含字母、数字和下划线中的两种或两种以上！'
        });
      }

      res.status(200).json({
        valid: true,
        message: '密码格式正确'
      });
    } catch (error) {
      console.error('Validate password error:', error);
      res.status(500).json({
        valid: false,
        error: '服务器错误'
      });
    }
  }

  /**
   * 验证姓名
   */
  async validateName(req, res) {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({
          valid: false,
          error: '请输入姓名！'
        });
      }

      // 计算字符长度（1个汉字算2个字符）
      const charLength = name.split('').reduce((len, char) => {
        return len + (/[\u4e00-\u9fa5]/.test(char) ? 2 : 1);
      }, 0);

      if (charLength < 3 || charLength > 30) {
        return res.status(400).json({
          valid: false,
          error: '允许输入的字符串在3-30个字符之间！'
        });
      }

      // 验证只包含中英文字符、点和单空格
      const nameRegex = /^[\u4e00-\u9fa5a-zA-Z.\s]+$/;
      if (!nameRegex.test(name)) {
        return res.status(400).json({
          valid: false,
          error: '请输入姓名！'
        });
      }

      res.status(200).json({
        valid: true,
        message: '姓名格式正确'
      });
    } catch (error) {
      console.error('Validate name error:', error);
      res.status(500).json({
        valid: false,
        error: '服务器错误'
      });
    }
  }

  /**
   * 验证证件号码
   */
  async validateIdCard(req, res) {
    try {
      const { idCardType, idCardNumber } = req.body;

      // 先验证格式，后验证长度
      if (idCardNumber) {
        // 验证只包含数字和字母
        const idCardRegex = /^[a-zA-Z0-9]+$/;
        if (!idCardRegex.test(idCardNumber)) {
          return res.status(400).json({
            valid: false,
            error: '输入的证件编号中包含中文信息或特殊字符！'
          });
        }
      }

      // 验证证件号码长度
      if (!idCardNumber || idCardNumber.length !== 18) {
        return res.status(400).json({
          valid: false,
          error: '请正确输入18位证件号码！'
        });
      }

      // 检查证件号码是否已注册
      const existingUser = await registrationDbService.findUserByIdCardNumber(idCardType, idCardNumber);
      if (existingUser) {
        return res.status(409).json({
          valid: false,
          error: '该证件号码已经被注册过，请确认是否您本人注册，"是"请使用原账号登录，"不是"请通过铁路12306App办理抢注或持该证件到就近的办理客运业务的铁路车站办理被抢注处理，完成后即可继续注册，或致电12306客服咨询。'
        });
      }

      res.status(200).json({
        valid: true,
        message: '证件号码格式正确且可用'
      });
    } catch (error) {
      console.error('Validate ID card error:', error);
      res.status(500).json({
        valid: false,
        error: '服务器错误'
      });
    }
  }

  /**
   * 验证邮箱
   */
  async validateEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(200).json({
          valid: true,
          message: '邮箱格式正确'
        });
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          valid: false,
          error: '请输入有效的电子邮件地址！'
        });
      }

      res.status(200).json({
        valid: true,
        message: '邮箱格式正确'
      });
    } catch (error) {
      console.error('Validate email error:', error);
      res.status(500).json({
        valid: false,
        error: '服务器错误'
      });
    }
  }

  /**
   * 验证手机号
   */
  async validatePhone(req, res) {
    try {
      const { phone } = req.body;

      // 验证手机号长度
      if (!phone || phone.length !== 11) {
        return res.status(400).json({
          valid: false,
          error: '您输入的手机号不是有效格式！'
        });
      }

      // 验证只包含数字
      const phoneRegex = /^[0-9]+$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          valid: false,
          error: '请输入正确的手机号码！'
        });
      }

      res.status(200).json({
        valid: true,
        message: '手机号码格式正确'
      });
    } catch (error) {
      console.error('Validate phone error:', error);
      res.status(500).json({
        valid: false,
        error: '服务器错误'
      });
    }
  }

  /**
   * 用户注册
   */
  async register(req, res) {
    try {
      const {
        username,
        password,
        confirmPassword,
        idCardType,
        name,
        idCardNumber,
        discountType,
        email,
        phone,
        agreedToTerms
      } = req.body;

      // 验证必填字段
      if (!username || !password || !confirmPassword || !idCardType || 
          !name || !idCardNumber || !discountType || !phone) {
        return res.status(400).json({
          error: '请填写完整信息！'
        });
      }

      // 验证密码一致性
      if (password !== confirmPassword) {
        return res.status(400).json({
          error: '确认密码与密码不一致！'
        });
      }

      // 验证用户协议
      if (!agreedToTerms) {
        return res.status(400).json({
          error: '请确认服务条款！'
        });
      }

      // 检查用户名是否已存在
      const existingUser = await registrationDbService.findUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({
          error: '该用户名已经被占用，请重新选择用户名！'
        });
      }

      // 检查证件号是否已注册
      const existingIdCard = await registrationDbService.findUserByIdCardNumber(idCardType, idCardNumber);
      if (existingIdCard) {
        return res.status(409).json({
          error: '该证件号码已经被注册过'
        });
      }

      // 创建会话，存储用户数据
      const sessionId = await sessionService.createSession({
        username,
        password,
        idCardType,
        name,
        idCardNumber,
        discountType,
        email,
        phone
      });

      res.status(201).json({
        message: '注册信息已提交，请进行验证',
        sessionId: sessionId
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        error: '服务器错误'
      });
    }
  }

  /**
   * 发送注册验证码
   */
  async sendRegistrationVerificationCode(req, res) {
    try {
      const { sessionId, phone, email } = req.body;

      // 验证会话
      const session = await sessionService.getSession(sessionId);
      if (!session) {
        return res.status(400).json({
          error: '会话无效或已过期'
        });
      }

      // 检查发送频率限制
      if (email) {
        const canSendEmail = await sessionService.checkEmailSendFrequency(email);
        if (!canSendEmail) {
          return res.status(429).json({
            error: '请求验证码过于频繁，请稍后再试！'
          });
        }
      }

      if (phone) {
        const canSendSms = await sessionService.checkSmsSendFrequency(phone);
        if (!canSendSms) {
          return res.status(429).json({
            error: '请求验证码过于频繁，请稍后再试！'
          });
        }
      }

      // 发送邮箱验证码（如果提供了email）
      if (email) {
        await registrationDbService.createEmailVerificationCode(email);
      }

      // 发送短信验证码（如果提供了phone）
      if (phone) {
        await registrationDbService.createSmsVerificationCode(phone);
      }

      res.status(200).json({
        message: '验证码发送成功'
      });
    } catch (error) {
      console.error('Send verification code error:', error);
      res.status(500).json({
        error: '服务器错误'
      });
    }
  }

  /**
   * 完成注册
   */
  async completeRegistration(req, res) {
    try {
      const { sessionId, smsCode, emailCode } = req.body;

      // 验证会话
      const session = await sessionService.getSession(sessionId);
      if (!session) {
        return res.status(400).json({
          error: '会话无效或已过期'
        });
      }

      const userData = session.user_data;

      // 验证短信验证码（如果提供了smsCode）
      if (smsCode) {
        const isValidSms = await registrationDbService.verifySmsCode(userData.phone, smsCode);
        if (!isValidSms) {
          return res.status(400).json({
            error: '验证码错误或已过期'
          });
        }
      }

      // 验证邮箱验证码（如果提供了emailCode）
      if (emailCode) {
        const isValidEmail = await registrationDbService.verifyEmailCode(userData.email, emailCode);
        if (!isValidEmail) {
          return res.status(400).json({
            error: '验证码错误或已过期'
          });
        }
      }

      // 创建用户
      try {
        const userId = await registrationDbService.createUser(userData);
        
        // 删除会话
        await sessionService.deleteSession(sessionId);

        res.status(201).json({
          message: '恭喜您注册成功，请到登录页面进行登录！',
          userId: userId
        });
      } catch (error) {
        if (error.message === 'User already exists') {
          return res.status(409).json({
            error: '用户已存在'
          });
        }
        throw error;
      }
    } catch (error) {
      console.error('Complete registration error:', error);
      res.status(500).json({
        error: '注册失败，请稍后重试'
      });
    }
  }

  /**
   * 获取服务条款
   */
  async getServiceTerms(req, res) {
    try {
      res.status(200).json({
        title: '服务条款',
        content: '中国铁路客户服务中心网站服务条款内容...'
      });
    } catch (error) {
      console.error('Get service terms error:', error);
      res.status(500).json({
        error: '服务器错误'
      });
    }
  }

  /**
   * 获取隐私政策
   */
  async getPrivacyPolicy(req, res) {
    try {
      res.status(200).json({
        title: '隐私权政策',
        englishTitle: 'NOTICE',
        content: '隐私权政策内容...'
      });
    } catch (error) {
      console.error('Get privacy policy error:', error);
      res.status(500).json({
        error: '服务器错误'
      });
    }
  }
}

module.exports = new RegisterController();

