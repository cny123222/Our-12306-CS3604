#!/bin/bash

# 车次数据测试套件运行脚本
# 按顺序运行所有测试并生成汇总报告

echo "════════════════════════════════════════════════════════════════"
echo "          车次数据集成与测试 - 完整测试套件"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "测试环境: $(node --version)"
echo "数据库路径: backend/database/railway.db"
echo "测试时间: $(date)"
echo ""
echo "════════════════════════════════════════════════════════════════"

# 初始化计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 函数：运行单个测试脚本
run_test() {
    local TEST_NAME=$1
    local TEST_SCRIPT=$2
    
    echo ""
    echo "────────────────────────────────────────────────────────────────"
    echo "  测试${TEST_NAME}"
    echo "────────────────────────────────────────────────────────────────"
    
    # 运行测试并捕获输出
    if node "$TEST_SCRIPT" > /tmp/test_output_$$.txt 2>&1; then
        # 测试通过
        cat /tmp/test_output_$$.txt
        
        # 提取测试统计
        local TESTS=$(grep "总测试数:" /tmp/test_output_$$.txt | awk '{print $2}')
        local PASSED=$(grep "通过:" /tmp/test_output_$$.txt | awk '{print $2}')
        local FAILED=$(grep "失败:" /tmp/test_output_$$.txt | awk '{print $2}')
        
        TOTAL_TESTS=$((TOTAL_TESTS + TESTS))
        PASSED_TESTS=$((PASSED_TESTS + PASSED))
        FAILED_TESTS=$((FAILED_TESTS + FAILED))
        
        echo ""
        echo "✅ ${TEST_NAME}完成: ${PASSED}/${TESTS} 通过"
        rm /tmp/test_output_$$.txt
        return 0
    else
        # 测试失败
        cat /tmp/test_output_$$.txt
        
        # 提取测试统计（即使失败也尝试提取）
        local TESTS=$(grep "总测试数:" /tmp/test_output_$$.txt | awk '{print $2}')
        local PASSED=$(grep "通过:" /tmp/test_output_$$.txt | awk '{print $2}')
        local FAILED=$(grep "失败:" /tmp/test_output_$$.txt | awk '{print $2}')
        
        if [ -n "$TESTS" ]; then
            TOTAL_TESTS=$((TOTAL_TESTS + TESTS))
            PASSED_TESTS=$((PASSED_TESTS + PASSED))
            FAILED_TESTS=$((FAILED_TESTS + FAILED))
            echo ""
            echo "❌ ${TEST_NAME}失败: ${PASSED}/${TESTS} 通过"
        else
            echo ""
            echo "❌ ${TEST_NAME}执行出错"
        fi
        
        rm /tmp/test_output_$$.txt
        return 1
    fi
}

# 切换到backend目录
cd "$(dirname "$0")/.." || exit 1

# 运行所有测试
echo ""
echo "开始运行测试套件..."

run_test "1: 数据库完整性验证" "scripts/verify-train-data.js"
TEST1_RESULT=$?

run_test "2: 余票计算逻辑" "scripts/test-seat-availability.js"
TEST2_RESULT=$?

run_test "3: 票价计算逻辑" "scripts/test-fare-calculation.js"
TEST3_RESULT=$?

run_test "4: 高并发购票场景" "scripts/test-concurrent-booking.js"
TEST4_RESULT=$?

run_test "5: 余票显示逻辑" "scripts/test-seat-display-logic.js"
TEST5_RESULT=$?

# 生成汇总报告
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "                    测试汇总报告"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "测试套件结果："
echo "  ├─ 数据库完整性验证 ........... $([ $TEST1_RESULT -eq 0 ] && echo '✅ 通过' || echo '❌ 失败')"
echo "  ├─ 余票计算逻辑 ............... $([ $TEST2_RESULT -eq 0 ] && echo '✅ 通过' || echo '❌ 失败')"
echo "  ├─ 票价计算逻辑 ............... $([ $TEST3_RESULT -eq 0 ] && echo '✅ 通过' || echo '❌ 失败')"
echo "  ├─ 高并发购票场景 ............. $([ $TEST4_RESULT -eq 0 ] && echo '✅ 通过' || echo '❌ 失败')"
echo "  └─ 余票显示逻辑 ............... $([ $TEST5_RESULT -eq 0 ] && echo '✅ 通过' || echo '❌ 失败')"
echo ""

echo "整体统计："
echo "  总测试数: ${TOTAL_TESTS}"
echo "  通过: ${PASSED_TESTS}"
echo "  失败: ${FAILED_TESTS}"

if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$(echo "scale=2; ${PASSED_TESTS} * 100 / ${TOTAL_TESTS}" | bc)
    echo "  通过率: ${PASS_RATE}%"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"

# 判断总体结果
if [ $TEST1_RESULT -eq 0 ] && [ $TEST2_RESULT -eq 0 ] && [ $TEST3_RESULT -eq 0 ] && [ $TEST5_RESULT -eq 0 ]; then
    echo ""
    echo "🎉 所有核心测试通过！车次数据库状态良好。"
    echo ""
    exit 0
else
    echo ""
    echo "⚠️  部分测试未通过，请检查上述报告。"
    echo ""
    exit 1
fi

