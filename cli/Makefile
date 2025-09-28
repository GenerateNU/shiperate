# Makefile install script
VENV_NAME=venv
PYTHON = python3
PYTHON_ENV = pyenv
PIP = $(VENV_NAME)/bin/pip
PYTHON_VENV = $(VENV_NAME)/bin/python
REQUIREMENTS = requirements.txt

$(VENV_NAME):
	$(PYTHON) -m venv $(VENV_NAME)

install: $(VENV_NAME)
	$(PIP) install -r $(REQUIREMENTS)

clean:
	rm -rf $(VENV_NAME)
