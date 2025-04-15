# Efficiency Expert Web Application (epweb)

A multi-tool web application with modules for TOC generation, PDF processing, Shift scheduling, and more.

## Project Overview

This application is a collection of productivity tools designed to work together in a unified web interface. The application uses a modular architecture with separate tools and a central dispatcher application.

### Key Components

1. **Main Application**
   - File: `app.py`
   - Serves as a dispatcher for different tool modules
   - Uses DispatcherMiddleware for routing

2. **Module Resolver**
   - File: `module_resolver.py`
   - Central module for dependency and path resolution
   - Handles:
     * Python path management
     * Module import validation
     * Tool directory path configuration
     * pptx module compatibility

3. **Tools**
   - TOC Generator (`/tools/TOC`)
   - PDF Tool (`/tools/pdf`)
   - Shift Scheduler (`/tools/shift`)

## Setup Instructions

### Prerequisites

- Python 3.12
- pip or conda package manager

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd epweb
```

2. **Install dependencies**

The easiest way to install all dependencies is to use the provided setup script:

```bash
# 通常のインストール
./setup.sh

# 仮想環境を使用してインストールする場合
./setup.sh --venv
```

This script will:
- Install all required Python packages
- Apply necessary patches for Python 3.12 compatibility
- Verify that all modules can be imported correctly
- Create necessary directories and symlinks

Alternatively, you can install the dependencies manually:

```bash
pip install -r requirements.txt
python pptx_compat_patch.py
```

3. **Configure the application**

Create a `.env` file in the project root with the following content:

```
PORT=5001
SECRET_KEY=your_secret_key_here
```

### Running the Application

To run the application, simply execute:

```bash
python app.py
```

The application will be available at `http://localhost:5001`.

## Module Resolution System

This application uses a custom module resolution system to ensure that all dependencies are properly accessible across the different tools. The system is implemented in `module_resolver.py` and provides the following features:

1. **Path Management**
   - Automatically adds the project root and tools directories to the Python path
   - Ensures that site-packages directories are in the Python path

2. **Module Import Validation**
   - Checks that all required modules can be imported
   - Provides detailed error messages for missing modules

3. **Tool-specific Environment Setup**
   - Sets up the environment for each tool
   - Creates necessary symlinks for problematic modules like pptx

4. **Python 3.12 Compatibility**
   - Applies patches for modules that are not yet fully compatible with Python 3.12
   - Specifically fixes issues with the python-pptx package

### Using the Module Resolver

To use the module resolver in a tool module, simply import it at the beginning of your script:

```python
import os
import sys

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Import the module resolver
import module_resolver

# Set up the tool environment
module_resolver.setup_tool_environment('tool_name')
```

## Troubleshooting

### Import Errors

If you encounter import errors, try the following:

1. Run the installation script again:
   ```bash
   python install_all_dependencies.py
   ```

2. Check that all required packages are installed:
   ```bash
   pip list
   ```

3. Verify that the python-pptx patch has been applied:
   ```bash
   python pptx_compat_patch.py
   ```

### Port Conflicts

If you encounter port conflicts, change the PORT in the `.env` file:

```
PORT=5002
```

## Dependencies

- Flask
- python-pptx
- PyPDF2
- openpyxl
- xlsxwriter
- lxml
- Pillow

## License

 2025 by CARSON Co.,Ltd.