import ast
import os
import shutil
import subprocess

class SandboxValidator:
    """
    自己改変後のコードを検証し、エラーがあればロールバックする
    """
    def __init__(self, target_dir="src"):
        self.target_dir = target_dir
        self.backup_dir = "backup_src"

    def create_backup(self):
        if os.path.exists(self.backup_dir):
            shutil.rmtree(self.backup_dir)
        shutil.copytree(self.target_dir, self.backup_dir)
        print("Backup created.")

    def rollback(self):
        if os.path.exists(self.backup_dir):
            shutil.rmtree(self.target_dir)
            shutil.copytree(self.backup_dir, self.target_dir)
            print("Rollback successful.")
        else:
            print("Backup not found. Rollback failed.")

    def validate_syntax(self):
        for root, _, files in os.walk(self.target_dir):
            for file in files:
                if file.endswith(".py"):
                    path = os.path.join(root, file)
                    try:
                        with open(path, "r", encoding="utf-8") as f:
                            ast.parse(f.read())
                    except SyntaxError as e:
                        print(f"Syntax error in {path}: {e}")
                        return False
        return True

    def run_tests(self):
        try:
            # pytestを実行
            result = subprocess.run(["pytest", "tests/"], capture_output=True, text=True)
            if result.returncode != 0:
                print(f"Tests failed:\n{result.stdout}\n{result.stderr}")
                return False
            return True
        except Exception as e:
            print(f"Test execution error: {e}")
            return False

    def finalize(self):
        print("Validation passed. Finalizing changes.")
        if os.path.exists(self.backup_dir):
            shutil.rmtree(self.backup_dir)

if __name__ == "__main__":
    validator = SandboxValidator()
    validator.create_backup()

    # 擬似的な検証プロセス
    if validator.validate_syntax():
        # 本来はここで pytest も実行
        validator.finalize()
    else:
        validator.rollback()
        exit(1)
