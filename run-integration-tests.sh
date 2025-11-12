#!/bin/bash

# 12306 注册功能集成测试执行脚本
# 功能：自动化执行所有集成测试并生成报告

echo "========================================================"
echo "   12306 注册功能集成测试套件"
echo "========================================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 检查服务是否运行
check_services() {
    echo -e "${BLUE}[1/5] 检查服务运行状态...${NC}"
    
    # 检查后端服务
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 后端服务运行正常 (http://localhost:3000)${NC}"
    else
        echo -e "${RED}✗ 后端服务未运行${NC}"
        echo -e "${YELLOW}请先启动后端服务: cd backend && npm start${NC}"
        exit 1
    fi
    
    # 检查前端服务
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 前端服务运行正常 (http://localhost:5173)${NC}"
    else
        echo -e "${RED}✗ 前端服务未运行${NC}"
        echo -e "${YELLOW}请先启动前端服务: cd frontend && npm run dev${NC}"
        exit 1
    fi
    
    echo ""
}

# 运行系统验证测试
run_system_verification() {
    echo -e "${BLUE}[2/5] 运行系统验证测试...${NC}"
    
    if node verify-system.js > /tmp/system-test.log 2>&1; then
        SYSTEM_TESTS=$(grep -c "✓" /tmp/system-test.log)
        echo -e "${GREEN}✓ 系统验证测试通过 (${SYSTEM_TESTS} 项)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + SYSTEM_TESTS))
        TOTAL_TESTS=$((TOTAL_TESTS + SYSTEM_TESTS))
    else
        echo -e "${RED}✗ 系统验证测试失败${NC}"
        cat /tmp/system-test.log
        exit 1
    fi
    
    echo ""
}

# 运行后端集成测试
run_backend_tests() {
    echo -e "${BLUE}[3/5] 运行后端API集成测试...${NC}"
    
    cd backend
    if npm test -- test/routes/register.test.js > /tmp/backend-test.log 2>&1; then
        BACKEND_TESTS=$(grep -E "Tests:.*passed" /tmp/backend-test.log | grep -oE "[0-9]+ passed" | grep -oE "[0-9]+")
        echo -e "${GREEN}✓ 后端测试通过 (${BACKEND_TESTS}/37)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + BACKEND_TESTS))
        TOTAL_TESTS=$((TOTAL_TESTS + BACKEND_TESTS))
    else
        echo -e "${RED}✗ 后端测试失败${NC}"
        cat /tmp/backend-test.log
        exit 1
    fi
    cd ..
    
    echo ""
}

# 运行前端组件测试
run_frontend_tests() {
    echo -e "${BLUE}[4/5] 运行前端组件测试...${NC}"
    
    cd frontend
    if npm test -- --run test/components/RegisterForm.test.tsx test/components/ValidationInput.test.tsx test/components/SelectDropdown.test.tsx test/components/SuccessModal.test.tsx > /tmp/frontend-test.log 2>&1; then
        FRONTEND_TESTS=$(grep -E "Tests:.*passed" /tmp/frontend-test.log | grep -oE "[0-9]+ passed" | grep -oE "[0-9]+")
        echo -e "${GREEN}✓ 前端测试通过 (${FRONTEND_TESTS}/98)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + FRONTEND_TESTS))
        TOTAL_TESTS=$((TOTAL_TESTS + FRONTEND_TESTS))
    else
        echo -e "${RED}✗ 前端测试失败${NC}"
        cat /tmp/frontend-test.log
        exit 1
    fi
    cd ..
    
    echo ""
}

# 生成测试报告
generate_report() {
    echo -e "${BLUE}[5/5] 生成测试报告...${NC}"
    
    PASS_RATE=$(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
    
    echo ""
    echo "========================================================"
    echo "   测试报告摘要"
    echo "========================================================"
    echo ""
    echo -e "总测试数量:   ${BLUE}${TOTAL_TESTS}${NC}"
    echo -e "通过测试:     ${GREEN}${PASSED_TESTS}${NC}"
    echo -e "失败测试:     ${RED}${FAILED_TESTS}${NC}"
    echo -e "通过率:       ${GREEN}${PASS_RATE}%${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 所有测试通过！系统可以投入使用！${NC}"
    else
        echo -e "${RED}❌ 部分测试失败，请检查日志${NC}"
    fi
    
    echo ""
    echo "详细测试报告: INTEGRATION_TEST_REPORT.md"
    echo "系统验证日志: /tmp/system-test.log"
    echo "后端测试日志: /tmp/backend-test.log"
    echo "前端测试日志: /tmp/frontend-test.log"
    echo ""
    echo "========================================================"
}

# 主流程
main() {
    check_services
    run_system_verification
    run_backend_tests
    run_frontend_tests
    generate_report
}

# 执行测试
main

