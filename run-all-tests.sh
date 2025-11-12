#!/bin/bash

# 12306 全量测试运行脚本
# 用法: ./run-all-tests.sh

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_section() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# 检查Node.js是否安装
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js未安装，请先安装Node.js"
        exit 1
    fi
    print_success "Node.js已安装: $(node --version)"
}

# 检查npm是否安装
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm未安装，请先安装npm"
        exit 1
    fi
    print_success "npm已安装: $(npm --version)"
}

# 安装依赖
install_dependencies() {
    print_section "检查并安装依赖"
    
    # 安装后端依赖
    if [ -d "backend" ]; then
        print_info "安装后端依赖..."
        cd backend
        if [ ! -d "node_modules" ]; then
            npm install || {
                print_error "后端依赖安装失败"
                exit 1
            }
            print_success "后端依赖安装完成"
        else
            print_success "后端依赖已存在"
        fi
        cd ..
    fi
    
    # 安装前端依赖
    if [ -d "frontend" ]; then
        print_info "安装前端依赖..."
        cd frontend
        if [ ! -d "node_modules" ]; then
            npm install || {
                print_error "前端依赖安装失败"
                exit 1
            }
            print_success "前端依赖安装完成"
        else
            print_success "前端依赖已存在"
        fi
        cd ..
    fi
}

# 运行后端测试
run_backend_tests() {
    print_section "运行后端测试"
    
    if [ ! -d "backend" ]; then
        print_warning "后端目录不存在，跳过后端测试"
        return 0
    fi
    
    cd backend
    print_info "执行: npm test -- --verbose --bail --forceExit"
    
    npm test -- --verbose --bail --forceExit
    BACKEND_EXIT_CODE=$?
    
    cd ..
    
    if [ $BACKEND_EXIT_CODE -eq 0 ]; then
        print_success "后端测试通过 ✓"
        return 0
    else
        print_error "后端测试失败 ✗"
        return 1
    fi
}

# 运行前端测试
run_frontend_tests() {
    print_section "运行前端测试"
    
    if [ ! -d "frontend" ]; then
        print_warning "前端目录不存在，跳过前端测试"
        return 0
    fi
    
    cd frontend
    print_info "执行: npm test -- --run --reporter=verbose --bail=1"
    
    npm test -- --run --reporter=verbose --bail=1
    FRONTEND_EXIT_CODE=$?
    
    cd ..
    
    if [ $FRONTEND_EXIT_CODE -eq 0 ]; then
        print_success "前端测试通过 ✓"
        return 0
    else
        print_error "前端测试失败 ✗"
        return 1
    fi
}

# 运行系统验证（可选）
run_system_verification() {
    print_section "运行系统验证 (可选)"
    
    if [ ! -f "verify-system.js" ]; then
        print_warning "verify-system.js不存在，跳过系统验证"
        return 0
    fi
    
    print_warning "系统验证需要后端和前端服务正在运行"
    read -p "是否运行系统验证？(y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "跳过系统验证"
        return 0
    fi
    
    print_info "执行: node verify-system.js"
    node verify-system.js
    
    if [ $? -eq 0 ]; then
        print_success "系统验证通过 ✓"
        return 0
    else
        print_error "系统验证失败 ✗"
        return 1
    fi
}

# 生成测试报告
generate_report() {
    print_section "测试报告"
    
    echo ""
    echo "测试结果汇总:"
    echo "-------------------------------------"
    
    if [ $BACKEND_RESULT -eq 0 ]; then
        echo -e "${GREEN}✓ 后端测试: 通过${NC}"
    else
        echo -e "${RED}✗ 后端测试: 失败${NC}"
    fi
    
    if [ $FRONTEND_RESULT -eq 0 ]; then
        echo -e "${GREEN}✓ 前端测试: 通过${NC}"
    else
        echo -e "${RED}✗ 前端测试: 失败${NC}"
    fi
    
    echo "-------------------------------------"
    
    if [ $BACKEND_RESULT -eq 0 ] && [ $FRONTEND_RESULT -eq 0 ]; then
        echo -e "${GREEN}🎉 所有测试通过！${NC}"
        return 0
    else
        echo -e "${RED}❌ 部分测试失败，请检查上述错误信息${NC}"
        return 1
    fi
}

# 主函数
main() {
    print_section "12306 测试套件执行"
    
    # 检查环境
    check_node
    check_npm
    
    # 安装依赖
    install_dependencies
    
    # 运行测试
    run_backend_tests
    BACKEND_RESULT=$?
    
    run_frontend_tests
    FRONTEND_RESULT=$?
    
    # 可选：运行系统验证
    # run_system_verification
    
    # 生成报告
    generate_report
    FINAL_RESULT=$?
    
    exit $FINAL_RESULT
}

# 执行主函数
main

