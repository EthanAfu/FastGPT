#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Wind API 安装测试脚本
"""

import os
import sys
import site

def check_wind_installation():
    """检查 Wind API 安装状态"""
    print("=" * 60)
    print("Wind API 安装检查")
    print("=" * 60)
    
    # 1. 检查 Python 版本
    print(f"\n1. Python 环境:")
    print(f"   版本: {sys.version}")
    print(f"   路径: {sys.executable}")
    
    # 2. 检查 Wind API 文件
    print(f"\n2. Wind API 文件检查:")
    wind_app_path = "/Applications/Wind API.app/Contents/python/WindPy.py"
    if os.path.exists(wind_app_path):
        print(f"   ✅ Wind API 应用已安装: {wind_app_path}")
    else:
        print(f"   ❌ Wind API 应用未找到: {wind_app_path}")
        print(f"   请确保已安装 Wind API.app")
        
    # 3. 检查 Python 包路径
    print(f"\n3. Python 包路径:")
    print(f"   用户包路径: {site.getusersitepackages()}")
    print(f"   系统包路径: {site.getsitepackages()[0]}")
    
    # 4. 检查软链接
    print(f"\n4. WindPy 软链接检查:")
    user_link = os.path.join(site.getusersitepackages(), "WindPy.py")
    system_link = os.path.join(site.getsitepackages()[0], "WindPy.py")
    
    if os.path.exists(user_link) or os.path.islink(user_link):
        print(f"   ✅ 用户包软链接存在: {user_link}")
    else:
        print(f"   ❌ 用户包软链接不存在: {user_link}")
        
    if os.path.exists(system_link) or os.path.islink(system_link):
        print(f"   ✅ 系统包软链接存在: {system_link}")
    else:
        print(f"   ⚠️  系统包软链接不存在: {system_link}")
    
    # 5. 检查 Wind 配置目录
    print(f"\n5. Wind 配置目录:")
    wind_config = os.path.expanduser("~/.Wind")
    if os.path.exists(wind_config):
        print(f"   ✅ Wind 配置目录存在: {wind_config}")
        
        # 检查自动登录配置
        config_file = os.path.expanduser("~/.Wind/WFT/users/Auth/user.config")
        if os.path.exists(config_file):
            try:
                import re
                with open(config_file, "r", encoding="utf-8") as f:
                    content = f.read()
                match = re.search(r'isAutoLogin="(\d+)"', content)
                if match:
                    is_auto_login = match.group(1)
                    if is_auto_login == "1":
                        print(f"   ✅ 自动登录已启用")
                    else:
                        print(f"   ⚠️  自动登录未启用，请在 Wind 终端中设置")
                else:
                    print(f"   ⚠️  无法读取自动登录配置")
            except Exception as e:
                print(f"   ⚠️  读取配置文件失败: {e}")
        else:
            print(f"   ⚠️  用户配置文件不存在，请先登录 Wind 终端")
    else:
        print(f"   ❌ Wind 配置目录不存在: {wind_config}")
        print(f"   请确保已登录 Wind 终端")
    
    # 6. 尝试导入 WindPy
    print(f"\n6. WindPy 导入测试:")
    try:
        from WindPy import w
        print(f"   ✅ WindPy 导入成功")
        
        # 7. 尝试连接 Wind
        print(f"\n7. Wind API 连接测试:")
        ret = w.start()
        if hasattr(ret, 'ErrorCode'):
            if ret.ErrorCode == 0:
                print(f"   ✅ Wind API 启动成功")
                
                # 检查连接状态
                is_connected = w.isconnected()
                if is_connected:
                    print(f"   ✅ Wind API 已连接")
                    
                    # 测试数据获取
                    print(f"\n8. 数据获取测试:")
                    test_ret = w.wss("000001.SZ", "sec_name", "")
                    if hasattr(test_ret, 'ErrorCode') and test_ret.ErrorCode == 0:
                        print(f"   ✅ 数据获取成功")
                        print(f"   证券名称: {test_ret.Data[0][0] if test_ret.Data else 'N/A'}")
                    else:
                        print(f"   ❌ 数据获取失败: {test_ret}")
                else:
                    print(f"   ❌ Wind API 未连接")
            else:
                print(f"   ❌ Wind API 启动失败，错误码: {ret.ErrorCode}")
                print(f"   错误信息: {ret.Data if hasattr(ret, 'Data') else 'Unknown'}")
        else:
            print(f"   ❌ Wind API 响应格式异常")
            
    except ImportError as e:
        print(f"   ❌ WindPy 导入失败: {e}")
        print(f"\n   建议执行以下安装命令:")
        print(f"   python3 -c \"")
        print(f"import os")
        print(f"import site")
        print(f"os.system('mkdir -p ' + site.getusersitepackages())")
        print(f"os.system('ln -sf \\\"/Applications/Wind API.app/Contents/python/WindPy.py\\\" ' + site.getusersitepackages())")
        print(f"os.system('rm -rf ~/.Wind')")
        print(f"os.system('ln -sf ~/Library/Containers/com.wind.mac.api/Data/.Wind ~/.Wind')")
        print(f"\"")
    except Exception as e:
        print(f"   ❌ 测试过程出错: {e}")
    
    print("\n" + "=" * 60)
    print("检查完成")
    print("=" * 60)

if __name__ == "__main__":
    check_wind_installation()