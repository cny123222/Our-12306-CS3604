#!/bin/bash

# Our-12306 项目清理脚本
# 用途：自动执行项目清理任务
# 使用方法：./cleanup-project.sh [--level=1|2|3] [--dry-run]
#
# 清理级别：
#   --level=1  高优先级清理（安全，无风险）
#   --level=2  中优先级清理（需要验证）
#   --level=3  低优先级清理（需要充分测试）
#   不指定level则只显示清理计划

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认参数
LEVEL=0
DRY_RUN=false

# 解析命令行参数
for arg in "$@"; do
  case $arg in
    --level=*)
      LEVEL="${arg#*=}"
      ;;
    --dry-run)
      DRY_RUN=true
      ;;
    --help)
      echo "使用方法: $0 [选项]"
      echo ""
      echo "选项:"
      echo "  --level=N     指定清理级别 (1-3)"
      echo "  --dry-run     模拟执行，不实际删除文件"
      echo "  --help        显示此帮助信息"
      echo ""
      echo "清理级别:"
      echo "  1 - 高优先级清理（安全，无风险）"
      echo "  2 - 中优先级清理（需要验证）"
      echo "  3 - 低优先级清理（需要充分测试）"
      exit 0
      ;;
  esac
done

# 打印标题
print_header() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
}

# 打印成功消息
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# 打印警告消息
print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# 打印错误消息
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# 打印信息消息
print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

# 检查是否在项目根目录
check_project_root() {
  if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "错误：请在项目根目录运行此脚本"
    exit 1
  fi
}

# 创建备份
create_backup() {
  print_info "创建数据库备份..."
  if [ -f "backend/database/railway.db" ]; then
    TIMESTAMP=$(date +%s)
    if [ "$DRY_RUN" = false ]; then
      cp backend/database/railway.db "backend/database/railway_backup_$TIMESTAMP.db"
      print_success "数据库已备份到 railway_backup_$TIMESTAMP.db"
    else
      print_info "[DRY RUN] 将备份到 railway_backup_$TIMESTAMP.db"
    fi
  fi
}

# 统计待清理文件
count_files_to_clean() {
  local count=0
  
  # .backup文件
  count=$((count + $(find backend/src/services -name "*.backup" 2>/dev/null | wc -l)))
  
  # 测试输出文件
  count=$((count + $(find backend -maxdepth 1 -name "*.txt" 2>/dev/null | wc -l)))
  
  # 特定用户脚本
  [ -f "add-passenger-for-od12322.js" ] && count=$((count + 1))
  
  if [ "$LEVEL" -ge 2 ]; then
    # 修复脚本
    count=$((count + $(find backend/scripts -name "fix-*.js" 2>/dev/null | wc -l)))
    
    # 重复测试文件
    [ -f "verify-login-integration.js" ] && count=$((count + 1))
    [ -f "verify-personal-info-system.js" ] && count=$((count + 1))
    [ -f "test-registration.js" ] && count=$((count + 1))
    [ -f "test-expired-order-fix.js" ] && count=$((count + 1))
    count=$((count + $(find . -maxdepth 1 -name "test-cross-interval-seat-allocation*.js" 2>/dev/null | wc -l)))
  fi
  
  if [ "$LEVEL" -ge 3 ]; then
    # tickets相关
    [ -f "backend/test/routes/tickets.test.js" ] && count=$((count + 1))
    [ -f "backend/src/routes/tickets.js" ] && count=$((count + 1))
    [ -f "backend/src/services/ticketService.js" ] && count=$((count + 1))
  fi
  
  echo $count
}

# 级别1：高优先级清理
cleanup_level_1() {
  print_header "执行高优先级清理 (Level 1)"
  
  local files_deleted=0
  
  # 1. 删除.backup文件
  print_info "1. 删除.backup文件..."
  local backup_files=$(find backend/src/services -name "*.backup" 2>/dev/null)
  if [ -n "$backup_files" ]; then
    for file in $backup_files; do
      if [ "$DRY_RUN" = false ]; then
        rm -f "$file"
        print_success "已删除: $file"
      else
        print_info "[DRY RUN] 将删除: $file"
      fi
      files_deleted=$((files_deleted + 1))
    done
  else
    print_info "未找到.backup文件"
  fi
  
  # 2. 删除测试输出文件
  print_info "2. 删除测试输出文件..."
  local txt_files=$(find backend -maxdepth 1 -name "*.txt" 2>/dev/null)
  if [ -n "$txt_files" ]; then
    for file in $txt_files; do
      if [ "$DRY_RUN" = false ]; then
        rm -f "$file"
        print_success "已删除: $file"
      else
        print_info "[DRY RUN] 将删除: $file"
      fi
      files_deleted=$((files_deleted + 1))
    done
  else
    print_info "未找到测试输出文件"
  fi
  
  # 3. 更新.gitignore
  print_info "3. 更新.gitignore..."
  if ! grep -q "# Test output files" backend/.gitignore 2>/dev/null; then
    if [ "$DRY_RUN" = false ]; then
      cat >> backend/.gitignore << 'EOF'

# Test output files
*.txt
test-*.txt
*.backup
EOF
      print_success ".gitignore已更新"
    else
      print_info "[DRY RUN] 将更新.gitignore"
    fi
  else
    print_info ".gitignore已包含相关规则"
  fi
  
  # 4. 删除特定用户脚本
  print_info "4. 删除特定用户脚本..."
  if [ -f "add-passenger-for-od12322.js" ]; then
    if [ "$DRY_RUN" = false ]; then
      rm -f "add-passenger-for-od12322.js"
      print_success "已删除: add-passenger-for-od12322.js"
    else
      print_info "[DRY RUN] 将删除: add-passenger-for-od12322.js"
    fi
    files_deleted=$((files_deleted + 1))
  else
    print_info "未找到特定用户脚本"
  fi
  
  print_success "Level 1 清理完成，共处理 $files_deleted 个文件"
}

# 级别2：中优先级清理
cleanup_level_2() {
  print_header "执行中优先级清理 (Level 2)"
  
  local files_moved=0
  
  # 1. 创建archive目录
  print_info "1. 创建archive目录..."
  if [ ! -d "backend/scripts/archive" ]; then
    if [ "$DRY_RUN" = false ]; then
      mkdir -p backend/scripts/archive
      print_success "已创建: backend/scripts/archive"
    else
      print_info "[DRY RUN] 将创建: backend/scripts/archive"
    fi
  else
    print_info "archive目录已存在"
  fi
  
  # 2. 移动修复脚本
  print_info "2. 归档已完成的修复脚本..."
  local fix_scripts=$(find backend/scripts -maxdepth 1 -name "fix-*.js" 2>/dev/null)
  if [ -n "$fix_scripts" ]; then
    for file in $fix_scripts; do
      if [ "$DRY_RUN" = false ]; then
        mv "$file" backend/scripts/archive/
        print_success "已归档: $file"
      else
        print_info "[DRY RUN] 将归档: $file"
      fi
      files_moved=$((files_moved + 1))
    done
  else
    print_info "未找到修复脚本"
  fi
  
  # 3. 创建integration-tests目录
  print_info "3. 创建integration-tests目录..."
  if [ ! -d "integration-tests" ]; then
    if [ "$DRY_RUN" = false ]; then
      mkdir -p integration-tests
      print_success "已创建: integration-tests"
    else
      print_info "[DRY RUN] 将创建: integration-tests"
    fi
  else
    print_info "integration-tests目录已存在"
  fi
  
  # 4. 移动集成测试
  print_info "4. 移动集成测试到integration-tests/..."
  local integration_files=(
    "e2e-complete-flow-test.js"
    "integration-test-home-trains.js"
    "integration-test-order.js"
    "integration-test-personal-info.js"
    "verify-system.js"
  )
  
  for file in "${integration_files[@]}"; do
    if [ -f "$file" ]; then
      if [ "$DRY_RUN" = false ]; then
        mv "$file" integration-tests/
        print_success "已移动: $file"
      else
        print_info "[DRY RUN] 将移动: $file"
      fi
      files_moved=$((files_moved + 1))
    fi
  done
  
  # 5. 删除重复的测试文件
  print_info "5. 删除重复的测试文件..."
  local duplicate_files=(
    "verify-login-integration.js"
    "verify-personal-info-system.js"
    "test-registration.js"
    "test-expired-order-fix.js"
  )
  
  for file in "${duplicate_files[@]}"; do
    if [ -f "$file" ]; then
      if [ "$DRY_RUN" = false ]; then
        rm -f "$file"
        print_success "已删除: $file"
      else
        print_info "[DRY RUN] 将删除: $file"
      fi
      files_moved=$((files_moved + 1))
    fi
  done
  
  # 删除座位分配测试
  local seat_files=$(find . -maxdepth 1 -name "test-cross-interval-seat-allocation*.js" 2>/dev/null)
  if [ -n "$seat_files" ]; then
    for file in $seat_files; do
      if [ "$DRY_RUN" = false ]; then
        rm -f "$file"
        print_success "已删除: $file"
      else
        print_info "[DRY RUN] 将删除: $file"
      fi
      files_moved=$((files_moved + 1))
    done
  fi
  
  print_success "Level 2 清理完成，共处理 $files_moved 个文件"
}

# 级别3：低优先级清理（废弃tickets API）
cleanup_level_3() {
  print_header "执行低优先级清理 (Level 3)"
  
  print_warning "警告：此级别将删除tickets API相关代码"
  print_warning "请确保已经充分测试且tickets API不再被使用"
  
  if [ "$DRY_RUN" = false ]; then
    read -p "是否继续？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      print_info "已取消Level 3清理"
      return
    fi
  fi
  
  local files_deleted=0
  
  # 1. 删除tickets测试
  print_info "1. 删除tickets测试文件..."
  if [ -f "backend/test/routes/tickets.test.js" ]; then
    if [ "$DRY_RUN" = false ]; then
      rm -f "backend/test/routes/tickets.test.js"
      print_success "已删除: backend/test/routes/tickets.test.js"
    else
      print_info "[DRY RUN] 将删除: backend/test/routes/tickets.test.js"
    fi
    files_deleted=$((files_deleted + 1))
  fi
  
  # 2. 删除tickets路由
  print_info "2. 删除tickets路由文件..."
  if [ -f "backend/src/routes/tickets.js" ]; then
    if [ "$DRY_RUN" = false ]; then
      rm -f "backend/src/routes/tickets.js"
      print_success "已删除: backend/src/routes/tickets.js"
    else
      print_info "[DRY RUN] 将删除: backend/src/routes/tickets.js"
    fi
    files_deleted=$((files_deleted + 1))
  fi
  
  # 3. 删除ticketService
  print_info "3. 删除ticketService文件..."
  if [ -f "backend/src/services/ticketService.js" ]; then
    if [ "$DRY_RUN" = false ]; then
      rm -f "backend/src/services/ticketService.js"
      print_success "已删除: backend/src/services/ticketService.js"
    else
      print_info "[DRY RUN] 将删除: backend/src/services/ticketService.js"
    fi
    files_deleted=$((files_deleted + 1))
  fi
  
  # 4. 提示手动更新app.js
  print_warning "需要手动操作："
  print_warning "请编辑 backend/src/app.js 删除以下两行："
  print_warning "  const ticketsRoutes = require('./routes/tickets');"
  print_warning "  app.use('/api/tickets', ticketsRoutes);"
  
  print_success "Level 3 清理完成，共删除 $files_deleted 个文件"
}

# 运行测试
run_tests() {
  print_header "运行测试验证"
  
  print_info "运行后端测试..."
  if [ "$DRY_RUN" = false ]; then
    cd backend
    if npm test 2>&1 | tee test-output.log; then
      print_success "后端测试通过"
      rm -f test-output.log
    else
      print_error "后端测试失败，请检查错误"
      print_warning "测试日志已保存到 backend/test-output.log"
      return 1
    fi
    cd ..
  else
    print_info "[DRY RUN] 将运行: npm test"
  fi
}

# 显示清理计划
show_cleanup_plan() {
  print_header "清理计划"
  
  echo ""
  echo "Level 1 - 高优先级清理（安全，无风险）:"
  echo "  • 删除 .backup 文件"
  echo "  • 删除测试输出 .txt 文件"
  echo "  • 更新 .gitignore"
  echo "  • 删除特定用户脚本"
  
  echo ""
  echo "Level 2 - 中优先级清理（需要验证）:"
  echo "  • 归档已完成的修复脚本"
  echo "  • 整理根目录的测试文件"
  echo "  • 删除重复的测试文件"
  
  echo ""
  echo "Level 3 - 低优先级清理（需要充分测试）:"
  echo "  • 废弃 tickets API"
  echo "  • 删除 ticketService"
  echo "  • 删除相关测试文件"
  
  echo ""
  local total_files=$(count_files_to_clean)
  print_info "预计清理文件数: $total_files"
  
  echo ""
  print_info "使用方法："
  print_info "  ./cleanup-project.sh --level=1           执行Level 1清理"
  print_info "  ./cleanup-project.sh --level=2           执行Level 1+2清理"
  print_info "  ./cleanup-project.sh --level=3           执行所有清理"
  print_info "  ./cleanup-project.sh --level=1 --dry-run 模拟执行"
}

# 主函数
main() {
  print_header "Our-12306 项目清理脚本"
  
  # 检查项目根目录
  check_project_root
  
  # 显示模式
  if [ "$DRY_RUN" = true ]; then
    print_warning "运行模式: DRY RUN (模拟执行，不实际修改文件)"
  fi
  
  # 如果没有指定level，显示清理计划
  if [ "$LEVEL" -eq 0 ]; then
    show_cleanup_plan
    exit 0
  fi
  
  # 创建备份
  create_backup
  
  # 执行清理
  if [ "$LEVEL" -ge 1 ]; then
    cleanup_level_1
  fi
  
  if [ "$LEVEL" -ge 2 ]; then
    echo ""
    cleanup_level_2
  fi
  
  if [ "$LEVEL" -ge 3 ]; then
    echo ""
    cleanup_level_3
  fi
  
  # 运行测试
  if [ "$LEVEL" -ge 1 ] && [ "$DRY_RUN" = false ]; then
    echo ""
    run_tests
  fi
  
  # 完成
  echo ""
  print_header "清理完成"
  
  if [ "$DRY_RUN" = false ]; then
    print_success "项目清理成功完成！"
    print_info "下一步："
    print_info "  1. 运行完整测试: cd backend && npm test"
    print_info "  2. 启动服务验证: npm run dev"
    print_info "  3. 提交更改: git add -A && git commit -m '🧹 清理项目文件'"
  else
    print_info "这是模拟运行，未实际修改文件"
    print_info "移除 --dry-run 参数以实际执行清理"
  fi
}

# 运行主函数
main

