document.addEventListener('DOMContentLoaded', () => {
    const calendarElement = document.getElementById('appointmentCalendar');
    const dateInput = document.querySelector('input[name="date"]');
    const counselorDropdown = document.querySelector('select[name="counselor_id"]');
    const timeSlotElement = document.getElementById('timeSlots'); // Element to display time slots
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let counselorAvailability = {};
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();

    const dayNameMap = {
        0: 'Sunday',
        1: 'Monday',
        2: 'Tuesday',
        3: 'Wednesday',
        4: 'Thursday',
        5: 'Friday',
        6: 'Saturday',
    };

    const updateQueryString = (key, value) => {
        const url = new URL(window.location);
        if (value) {
            url.searchParams.set(key, value);
        } else {
            url.searchParams.delete(key);
        }
        window.history.replaceState(null, '', url.toString());
    };

    const fetchAndRenderCalendar = (counselorId) => {
        if (counselorId) {
            fetch(`/get_counselor_availability/${counselorId}`)
                .then(response => response.json())
                .then(data => {
                    counselorAvailability = data;
                    renderCalendar(currentMonth, currentYear);
                })
                .catch(error => {
                    console.error("Error fetching counselor availability:", error);
                    counselorAvailability = {};
                    renderCalendar(currentMonth, currentYear);
                });
        } else {
            counselorAvailability = {};
            renderCalendar(currentMonth, currentYear);
        }
    };

    fetchTimeSlots = (counselorId, date) => {
        fetch(`/schdeule?counselor_id=${counselorId}&date=${date}`)
            .then(response => response.json())
            .then(data => {
                const timeSlotDropdown = document.getElementById('timeSlotDropdown');
                timeSlotDropdown.innerHTML = ''; // Clear existing options
                
                if (data.length > 0) {
                    data.forEach(slot => {
                        const option = document.createElement('option');
                        option.value = slot;
                        option.textContent = slot;
                        timeSlotDropdown.appendChild(option);
                    });
                } else {
                    const option = document.createElement('option');
                    option.textContent = 'No slots available';
                    timeSlotDropdown.appendChild(option);
                }
            })
            .catch(error => console.error("Error fetching time slots:", error));
    };
    
    
    
    // Trigger fetchTimeSlots when the date picker value changes
    dateInput.addEventListener('change', () => {
        const selectedDate = dateInput.value;
        const selectedCounselorId = counselorDropdown.value;
        if (selectedCounselorId && selectedDate) {
            fetchTimeSlots(selectedCounselorId, selectedDate);
            updateQueryString('date', selectedDate);
        }
    });
    
    
    const renderCalendar = (month, year) => {
        calendarElement.innerHTML = '';

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const daysOfWeek = Object.values(dayNameMap);

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';

        const prevButton = document.createElement('button');
        prevButton.textContent = '<';
        prevButton.style.cursor = 'pointer';
        prevButton.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar(currentMonth, currentYear);
        });
        header.appendChild(prevButton);

        const title = document.createElement('h4');
        title.textContent = `${monthNames[month]} ${year}`;
        header.appendChild(title);

        const nextButton = document.createElement('button');
        nextButton.textContent = '>';
        nextButton.style.cursor = 'pointer';
        nextButton.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar(currentMonth, currentYear);
        });
        header.appendChild(nextButton);

        calendarElement.appendChild(header);

        const daysRow = document.createElement('div');
        daysRow.style.display = 'grid';
        daysRow.style.gridTemplateColumns = 'repeat(7, 1fr)';
        daysRow.style.textAlign = 'center';
        daysOfWeek.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.textContent = day.slice(0, 3);
            daysRow.appendChild(dayElement);
        });
        calendarElement.appendChild(daysRow);

        const datesGrid = document.createElement('div');
        datesGrid.style.display = 'grid';
        datesGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
        datesGrid.style.textAlign = 'center';

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            datesGrid.appendChild(document.createElement('div'));
        }

        for (let date = 1; date <= daysInMonth; date++) {
            const dateElement = document.createElement('div');
            const fullDate = new Date(year, month, date);
            const dayName = dayNameMap[fullDate.getDay()];

            dateElement.style.padding = '10px';
            dateElement.style.cursor = 'pointer';
            dateElement.style.border = '1px solid #ddd';
            dateElement.textContent = date;

            if (fullDate < today) {
                dateElement.style.backgroundColor = '#e9ecef';
                dateElement.style.color = '#6c757d';
                dateElement.style.pointerEvents = 'none';
            } else if (counselorAvailability[dayName]) {
                dateElement.style.backgroundColor = '#28a745';
                dateElement.style.color = '#fff';
                dateElement.addEventListener('click', () => {
                    const selectedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                    dateInput.value = selectedDate;
                    updateQueryString('date', selectedDate);
                    fetchTimeSlots(counselorDropdown.value, selectedDate);
                });
            } else {
                dateElement.style.backgroundColor = '#e9ecef';
                dateElement.style.color = '#6c757d';
                dateElement.style.pointerEvents = 'none';
            }

            datesGrid.appendChild(dateElement);
        }

        calendarElement.appendChild(datesGrid);
    };

    counselorDropdown.addEventListener('change', () => {
        const selectedCounselorId = counselorDropdown.value;
        updateQueryString('counselor_id', selectedCounselorId);
        fetchAndRenderCalendar(selectedCounselorId);
        timeSlotElement.innerHTML = ''; // Clear time slots when counselor changes
    });

    const initialCounselorId = counselorDropdown.value;
    fetchAndRenderCalendar(initialCounselorId);
});
