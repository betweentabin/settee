document.addEventListener('DOMContentLoaded', () => {
  // Tab switching functionality
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // Function to create delete button
  const createDeleteButton = (container) => {
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '✕';
    deleteBtn.addEventListener('click', (e) => {
      const inputWrapper = e.target.closest('.input-wrapper');
      if (inputWrapper) {
        // For temp positions, always allow deletion
        // For regular positions, only allow if there's more than one
        const isTemp = container.classList.contains('temp-position-inputs');
        if (isTemp || container.children.length > 1) {
          inputWrapper.remove();
        }
      }
    });
    return deleteBtn;
  };

  // Function to create input wrapper
  const createInputWrapper = (placeholder, container) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'input-wrapper';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control';
    input.placeholder = placeholder;
    
    wrapper.appendChild(input);
    
    // Add delete button for all inputs except the first position input
    const isFirstPositionInput = container.classList.contains('position-inputs') && 
                                container.querySelectorAll('.input-wrapper').length === 0;
    
    if (!isFirstPositionInput) {
      const deleteBtn = createDeleteButton(container);
      wrapper.appendChild(deleteBtn);
    }
    
    return wrapper;
  };

  // Add position button functionality
  const addPositionBtns = document.querySelectorAll('.add-btn');
  addPositionBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const container = e.target.previousElementSibling;
      const isTemp = container.classList.contains('temp-position-inputs');
      const placeholder = isTemp ? '窓口・清掃' : '受付';
      
      const wrapper = createInputWrapper(placeholder, container);
      container.appendChild(wrapper);
    });
  });

  // Initialize existing inputs with delete buttons
  const initializeExistingInputs = () => {
    // First, clean up any existing wrappers and buttons
    document.querySelectorAll('.input-wrapper').forEach(wrapper => {
      wrapper.querySelectorAll('.delete-btn').forEach((btn, index) => {
        if (index > 0) btn.remove(); // Keep only the first delete button
      });
    });

    const containers = document.querySelectorAll('.position-inputs, .temp-position-inputs');
    containers.forEach(container => {
      const inputs = container.querySelectorAll('input[type="text"]');
      inputs.forEach((input, index) => {
        const isFirstPositionInput = container.classList.contains('position-inputs') && index === 0;
        
        // Skip if it's already in a wrapper
        if (input.closest('.input-wrapper')) return;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'input-wrapper';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        
        if (!isFirstPositionInput) {
          wrapper.appendChild(createDeleteButton(container));
        }
      });
    });
  };

  initializeExistingInputs();

  // Handle break type radio buttons
  const breakTypeRadios = document.querySelectorAll('input[name="break-type"]');
  const breakDetails = document.querySelector('.break-details');

  const toggleBreakDetails = (show) => {
    breakDetails.style.display = show ? 'flex' : 'none';
  };

  breakTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      toggleBreakDetails(e.target.value === 'あり');
    });
  });

  // Initialize break details visibility based on default selection
  const initialBreakType = document.querySelector('input[name="break-type"]:checked');
  if (initialBreakType) {
    toggleBreakDetails(initialBreakType.value === 'あり');
  }

  // Function to create time options list
  const createTimeOptionsList = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      ['00', '15', '30', '45'].forEach(minute => {
        options.push(`${String(hour).padStart(2, '0')}:${minute}`);
      });
    }
    return options;
  };

  const validTimeOptions = createTimeOptionsList();

  // Function to find nearest valid time
  const findNearestValidTime = (timeStr) => {
    const [inputHours, inputMinutes] = timeStr.split(':').map(Number);
    const inputTotalMinutes = inputHours * 60 + inputMinutes;

    return validTimeOptions.reduce((nearest, option) => {
      const [hours, minutes] = option.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes;
      const currentDiff = Math.abs(totalMinutes - inputTotalMinutes);
      const nearestDiff = Math.abs(nearest.totalMinutes - inputTotalMinutes);

      return currentDiff < nearestDiff ? { time: option, totalMinutes } : nearest;
    }, { time: validTimeOptions[0], totalMinutes: 0 }).time;
  };

  // Set up time inputs
  const timeInputs = document.querySelectorAll('input[type="time"]');
  timeInputs.forEach(input => {
    // Set step attribute for 15-minute intervals
    input.setAttribute('step', '900'); // 900 seconds = 15 minutes

    // Create and append datalist
    const datalistId = `timeOptions-${Math.random().toString(36).substr(2, 9)}`;
    const datalist = document.createElement('datalist');
    datalist.id = datalistId;
    
    validTimeOptions.forEach(timeOption => {
      const option = document.createElement('option');
      option.value = timeOption;
      datalist.appendChild(option);
    });
    
    input.setAttribute('list', datalistId);
    input.parentNode.insertBefore(datalist, input.nextSibling);

    input.addEventListener('change', (e) => {
      if (e.target.value) {
        e.target.value = findNearestValidTime(e.target.value);
      }
    });

    input.addEventListener('input', (e) => {
      if (e.target.value) {
        const nearestValidTime = findNearestValidTime(e.target.value);
        if (e.target.value !== nearestValidTime) {
          e.target.value = nearestValidTime;
        }
      }
    });
  });

  // Set up number inputs
  const numberInputs = document.querySelectorAll('input[type="number"]');
  numberInputs.forEach(input => {
    // Set attributes for 15-minute intervals
    input.setAttribute('step', '15');
    input.setAttribute('min', '15');
    input.setAttribute('max', '120');

    // Create and append datalist for number inputs
    const datalistId = `numberOptions-${Math.random().toString(36).substr(2, 9)}`;
    const datalist = document.createElement('datalist');
    datalist.id = datalistId;
    
    // Add options for 15-minute intervals from 15 to 120
    for (let i = 15; i <= 120; i += 15) {
      const option = document.createElement('option');
      option.value = i;
      datalist.appendChild(option);
    }
    
    input.setAttribute('list', datalistId);
    input.parentNode.insertBefore(datalist, input.nextSibling);

    input.addEventListener('change', (e) => {
      const value = parseInt(e.target.value);
      if (!isNaN(value)) {
        const roundedValue = Math.round(value / 15) * 15;
        e.target.value = Math.min(Math.max(roundedValue, 15), 120);
      }
    });

    input.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      if (!isNaN(value) && value % 15 !== 0) {
        const roundedValue = Math.round(value / 15) * 15;
        e.target.value = Math.min(Math.max(roundedValue, 15), 120);
      }
    });
  });

  // Form submission
  const form = document.querySelector('.shift-generator');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      console.log('Generating shift schedule...');
      // Add shift generation logic here
    });
  }
});