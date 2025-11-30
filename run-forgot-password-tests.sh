#!/bin/bash

# 密码找回功能测试运行脚本
# 用于运行所有与密码找回功能相关的测试

set -e

echo "========================================="
echo "  密码找回功能测试套件"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 记录测试结果
BACKEND_PASS=0
FRONTEND_PASS=0

# 后端测试
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  1. 后端测试${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd backend

echo -e "${GREEN}[1/2] 运行路由测试...${NC}"
if npm test -- routes/passwordReset.test.js 2>&1; then
    echo -e "${GREEN}✓ 路由测试通过${NC}"
    ((BACKEND_PASS++))
else
    echo -e "${RED}✗ 路由测试失败${NC}"
fi
echo ""

echo -e "${GREEN}[2/2] 运行服务测试...${NC}"
if npm test -- services/passwordResetService.test.js 2>&1; then
    echo -e "${GREEN}✓ 服务测试通过${NC}"
    ((BACKEND_PASS++))
else
    echo -e "${RED}✗ 服务测试失败${NC}"
fi
echo ""

cd ..

# 前端测试
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  2. 前端测试${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd frontend

echo -e "${GREEN}[1/5] 运行跨页面流程测试...${NC}"
if npm test -- ForgotPasswordFlow.cross.spec.tsx 2>&1; then
    echo -e "${GREEN}✓ 跨页面流程测试通过${NC}"
    ((FRONTEND_PASS++))
else
    echo -e "${RED}✗ 跨页面流程测试失败${NC}"
fi
echo ""

echo -e "${GREEN}[2/5] 运行 AccountInfoStep 测试...${NC}"
if npm test -- AccountInfoStep.test.tsx 2>&1; then
    echo -e "${GREEN}✓ AccountInfoStep 测试通过${NC}"
    ((FRONTEND_PASS++))
else
    echo -e "${RED}✗ AccountInfoStep 测试失败${NC}"
fi
echo ""

echo -e "${GREEN}[3/5] 运行 VerificationCodeStep 测试...${NC}"
if npm test -- VerificationCodeStep.test.tsx 2>&1; then
    echo -e "${GREEN}✓ VerificationCodeStep 测试通过${NC}"
    ((FRONTEND_PASS++))
else
    echo -e "${RED}✗ VerificationCodeStep 测试失败${NC}"
fi
echo ""

echo -e "${GREEN}[4/5] 运行 SetNewPasswordStep 测试...${NC}"
if npm test -- SetNewPasswordStep.test.tsx 2>&1; then
    echo -e "${GREEN}✓ SetNewPasswordStep 测试通过${NC}"
    ((FRONTEND_PASS++))
else
    echo -e "${RED}✗ SetNewPasswordStep 测试失败${NC}"
fi
echo ""

echo -e "${GREEN}[5/5] 运行 ProgressBar 测试...${NC}"
if npm test -- ProgressBar.test.tsx 2>&1; then
    echo -e "${GREEN}✓ ProgressBar 测试通过${NC}"
    ((FRONTEND_PASS++))
else
    echo -e "${RED}✗ ProgressBar 测试失败${NC}"
fi
echo ""

cd ..

# 测试结果总结
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  测试结果总结${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "后端测试: $BACKEND_PASS/2 通过"
echo "前端测试: $FRONTEND_PASS/5 通过"
echo ""

TOTAL_PASS=$((BACKEND_PASS + FRONTEND_PASS))
TOTAL_TESTS=7

if [ $TOTAL_PASS -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ✓ 所有测试通过! ($TOTAL_PASS/$TOTAL_TESTS)${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  ✗ 部分测试失败 ($TOTAL_PASS/$TOTAL_TESTS)${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi

