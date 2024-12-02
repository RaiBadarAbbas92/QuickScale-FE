import React, { useState, useRef, useEffect } from 'react';
import { FaWeight, FaTruck, FaUser, FaDollarSign, FaPrint, FaSearch, FaPlus, FaSave, FaList, FaCalendarAlt } from 'react-icons/fa';
import './App.css';

interface Entry {
  serialNumber: string;
  driverName: string;
  vehicleNumber: string;
  firstWeight: number;
  secondWeight: number;
  finalWeight: number;
  weightPer40: string;
  amount: number;
  date: string;
  time: string;
  secondDate?: string;
  secondTime?: string;
}
 
interface PrintField {
  id: string;
  value: string;
  position: {
    x: number;
    y: number;
  };
  isBold?: boolean;
}

const WeightStation: React.FC = () => {
  const [firstWeight, setFirstWeight] = useState<number>(0);
  const [secondWeight, setSecondWeight] = useState<number>(0);
  const [serialNumber, setSerialNumber] = useState<string>('1');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [finalWeight, setFinalWeight] = useState<number>(0);
  const [weightPer40, setWeightPer40] = useState<string>('0');
  const [savedEntries, setSavedEntries] = useState<Entry[]>([]);
  const [notification, setNotification] = useState<string>('');
  const [currentEntry, setCurrentEntry] = useState<Entry | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [secondDate, setSecondDate] = useState<string>('');
  const [secondTime, setSecondTime] = useState<string>('');
  const [searchSerial, setSearchSerial] = useState<string>('');
  const [searchResult, setSearchResult] = useState<Entry | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const componentRef = useRef<HTMLDivElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const printButtonRef = useRef<HTMLButtonElement>(null);
  const [printPositions, setPrintPositions] = useState<{[key: string]: {x: number, y: number}}>(
    JSON.parse(localStorage.getItem('printPositions') || '{}')
  );

  useEffect(() => {
    const savedEntriesFromStorage = localStorage.getItem('weightStationEntries');
    if (savedEntriesFromStorage) {
      try {
        const entries = JSON.parse(savedEntriesFromStorage);
        setSavedEntries(entries);
        if (entries.length > 0) {
          const lastSerial = entries[entries.length - 1].serialNumber;
          const nextSerial = isNaN(parseInt(lastSerial)) ? '1' : (parseInt(lastSerial) + 1).toString();
          setSerialNumber(nextSerial);
        }
      } catch (error) {
        console.error('Error parsing saved entries:', error);
        setSerialNumber('1');
      }
    }

    const updateDateTime = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString());
      setCurrentTime(now.toLocaleTimeString());
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, nextField: string) => {
    if (e.key === 'Enter') {
      if (nextField === 'save') {
        saveButtonRef.current?.focus();
      } else {
        const nextElement = document.querySelector(`[name="${nextField}"]`) as HTMLElement;
        if (nextElement) nextElement.focus();
      }
    }
  };

  const handleButtonKeyPress = (e: React.KeyboardEvent<HTMLButtonElement>, nextButtonClass: string) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      const nextButton = document.querySelector(`.${nextButtonClass}`) as HTMLElement;
      if (nextButton) nextButton.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const buttons = document.querySelectorAll('.btn');
      const currentIndex = Array.from(buttons).findIndex(button => button === e.currentTarget);
      if (currentIndex > 0) {
        (buttons[currentIndex - 1] as HTMLElement).focus();
      }
    }
  };

  const calculateFinalWeight = (second: number) => {
    const final = Math.abs(firstWeight - second);
    setFinalWeight(final);
    
    const per40 = final / 40;
    const wholePart = Math.floor(per40);
    const decimalPart = per40 - wholePart;
    const decimalResult = decimalPart * 40;
    
    const formattedWeight = decimalPart === 0 ? 
      wholePart.toString() : 
      `${wholePart}.${Math.round(decimalResult)}`;
    
    setWeightPer40(formattedWeight);

    // Set second date and time when second weight is entered
    const now = new Date();
    setSecondDate(now.toLocaleDateString());
    setSecondTime(now.toLocaleTimeString());
  };

  const handleSave = () => {
    // Check if serial number already exists and not in edit mode
    if (!isEditing && savedEntries.some(entry => entry.serialNumber === serialNumber)) {
      setNotification('Serial number already exists. Please use a different serial number.');
      return;
    }

    if (!firstWeight || firstWeight === 0) {
      setNotification('Please enter first weight');
      return;
    }
    if (!vehicleNumber) {
      setNotification('Please enter vehicle number');
      return;
    }
    if (!amount || amount === 0) {
      setNotification('Please enter amount');
      return;
    }

    const entry: Entry = {
      serialNumber,
      driverName,
      vehicleNumber,
      firstWeight,
      secondWeight,
      finalWeight: secondWeight ? Math.abs(firstWeight - secondWeight) : 0,
      weightPer40: secondWeight ? weightPer40 : '0',
      amount,
      date: currentDate,
      time: currentTime,
      secondDate: secondWeight ? secondDate : undefined,
      secondTime: secondWeight ? secondTime : undefined
    };

    let updatedEntries;
    if (isEditing) {
      updatedEntries = savedEntries.map(existingEntry => 
        existingEntry.serialNumber === serialNumber ? entry : existingEntry
      );
    } else {
      updatedEntries = [...savedEntries, entry];
    }

    setSavedEntries(updatedEntries);
    localStorage.setItem('weightStationEntries', JSON.stringify(updatedEntries));
    setCurrentEntry(entry);
    setNotification('Entry saved successfully');
    setIsEditing(false);

    // Focus print button after successful save
    if (printButtonRef.current) {
      printButtonRef.current.focus();
    }
  };

  const handleNew = () => {
    setVehicleNumber('');
    setDriverName('');
    setFirstWeight(0);
    setSecondWeight(0);
    setFinalWeight(0);
    setWeightPer40('0');
    setAmount(0);
    setNotification('');
    setCurrentEntry(null);
    setSearchResult(null);
    setIsEditing(false);
    setSecondDate('');
    setSecondTime('');
    
    const nextSerial = (parseInt(savedEntries[savedEntries.length - 1]?.serialNumber || '0') + 1).toString();
    setSerialNumber(nextSerial);
    
    const vehicleInput = document.querySelector('[name="vehicleNumber"]') as HTMLElement;
    if (vehicleInput) vehicleInput.focus();
  };

  const handlePrint = () => {
    if (!currentEntry) {
      setNotification('Please save an entry before printing');
      return;
    }

    const defaultFields: PrintField[] = [
      { id: 'serial', value: currentEntry.serialNumber, position: {x: 50, y: 50} },
      { id: 'date', value: currentEntry.date, position: {x: 50, y: 100} },
      { id: 'time', value: currentEntry.time, position: {x: 50, y: 150} },
      { id: 'secondDate', value: currentEntry.secondDate || '', position: {x: 50, y: 200} },
      { id: 'secondTime', value: currentEntry.secondTime || '', position: {x: 50, y: 250} },
      { id: 'vehicle', value: currentEntry.vehicleNumber, position: {x: 50, y: 300} },
      { id: 'driver', value: currentEntry.driverName, position: {x: 50, y: 350} },
      { id: 'amount', value: currentEntry.amount.toString(), position: {x: 50, y: 400} },
      { id: 'firstWeight', value: `${currentEntry.firstWeight}`, position: {x: 50, y: 450}, isBold: true },
      { id: 'secondWeight', value: `${currentEntry.secondWeight}`, position: {x: 50, y: 500}, isBold: true },
      { id: 'finalWeight', value: `${currentEntry.finalWeight}`, position: {x: 50, y: 550}, isBold: true },
      { id: 'weightPer40', value: `${currentEntry.weightPer40}`, position: {x: 50, y: 600}, isBold: true }
    ];

    const fields = defaultFields.map(field => ({
      ...field,
      position: printPositions[field.id] || field.position
    }));

    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      const printContent = `
        <html>
        <head>
          <style>
            @page {
              size: portrait;
            }
            @media print {
              .print-buttons {
                display: none !important;
              }
            }
            .print-field {
              position: absolute;
              user-select: none;
              padding: 5px;
              background: white;
              display: flex;
              gap: 10px;
            }
            .print-field.bold {
              font-weight: bold;
              font-size: 1.2em;
            }
            .print-buttons {
              position: fixed;
              bottom: 20px;
              left: 50%;
              transform: translateX(-50%);
              display: flex;
              gap: 10px;
            }
            .print-button {
              padding: 10px 20px;
              cursor: pointer;
              background: #4CAF50;
              color: white;
              border: none;
              border-radius: 4px;
            }
            .reset-button {
              padding: 10px 20px;
              cursor: pointer;
              background: #f44336;
              color: white;
              border: none;
              border-radius: 4px;
            }
            .edit-mode .print-field {
              border: 2px solid #2196F3;
            }
          </style>
        </head>
        <body>
          <div style="padding: 20px; font-family: Arial;">
            <div id="print-fields">
              ${fields.map(field => `
                <div class="print-field ${field.isBold ? 'bold' : ''}" id="${field.id}" style="left: ${field.position.x}px; top: ${field.position.y}px;">
                  <span>${field.value}</span>
                </div>
              `).join('')}
            </div>
            <div class="print-buttons">
              <button class="print-button" onclick="window.print()">Print</button>
              <button class="reset-button" onclick="resetPositions()">Reset Positions</button>
              <button id="editButton" onclick="toggleEdit()">Edit Positions</button>
              <button id="saveButton" onclick="savePositions()" style="display: none;">Save Positions</button>
            </div>
          </div>
          <script>
            let activeField = null;
            let initialX = 0;
            let initialY = 0;
            let isEditMode = false;
            const container = document.getElementById('print-fields');

            function toggleEdit() {
              isEditMode = !isEditMode;
              container.classList.toggle('edit-mode');
              document.getElementById('editButton').style.display = isEditMode ? 'none' : 'block';
              document.getElementById('saveButton').style.display = isEditMode ? 'block' : 'none';
              
              const fields = document.querySelectorAll('.print-field');
              fields.forEach(field => {
                if (isEditMode) {
                  field.addEventListener('mousedown', startDragging);
                } else {
                  field.removeEventListener('mousedown', startDragging);
                }
              });
            }

            function startDragging(e) {
              if (!isEditMode) return;
              activeField = e.target.closest('.print-field');
              const rect = activeField.getBoundingClientRect();
              initialX = e.clientX - rect.left;
              initialY = e.clientY - rect.top;
            }

            function drag(e) {
              if (activeField && isEditMode) {
                e.preventDefault();
                activeField.style.left = (e.clientX - initialX) + 'px';
                activeField.style.top = (e.clientY - initialY) + 'px';
              }
            }

            function stopDragging() {
              activeField = null;
            }

            function savePositions() {
              const positions = {};
              document.querySelectorAll('.print-field').forEach(field => {
                positions[field.id] = {
                  x: parseInt(field.style.left),
                  y: parseInt(field.style.top)
                };
              });
              window.opener.postMessage({
                type: 'savePrintPositions',
                positions: positions
              }, '*');
              toggleEdit();
            }

            function resetPositions() {
              const fields = ${JSON.stringify(defaultFields)};
              fields.forEach(field => {
                const element = document.getElementById(field.id);
                if (element) {
                  element.style.left = field.position.x + 'px';
                  element.style.top = field.position.y + 'px';
                }
              });
            }

            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDragging);
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();

      window.addEventListener('message', (event) => {
        if (event.data.type === 'savePrintPositions') {
          setPrintPositions(event.data.positions);
          localStorage.setItem('printPositions', JSON.stringify(event.data.positions));
        }
      });
    }
  };

  const handleSearchBySerial = () => {
    const foundEntry = savedEntries.find(entry => entry.serialNumber === searchSerial);
    if (foundEntry) {
      setSearchResult(foundEntry);
      setNotification('Entry found');
      setVehicleNumber(foundEntry.vehicleNumber);
      setDriverName(foundEntry.driverName);
      setAmount(foundEntry.amount);
      setFirstWeight(foundEntry.firstWeight);
      setSecondWeight(foundEntry.secondWeight);
      setFinalWeight(foundEntry.finalWeight);
      setWeightPer40(foundEntry.weightPer40);
      setSerialNumber(foundEntry.serialNumber);
      setSecondDate(foundEntry.secondDate || '');
      setSecondTime(foundEntry.secondTime || '');
      setIsEditing(true);
    } else {
      setSearchResult(null);
      setNotification('No entry found with this serial number');
    }
  };

  return (
    <div className="container">
      <div className="wrapper">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <FaWeight size={32} />
              <h1>Rai Digital Computer Weight Station</h1>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <p className="contact">Contact: +92-3016060072</p>
            </div>
          </div>
        </header>

        <div className="main-content">
          <div className="content-grid" ref={componentRef}>
            <div className="input-section">
              <div className="input-group">
                <label>Serial Number:</label>
                <input
                  type="text"
                  value={serialNumber}
                  disabled
                  style={{fontWeight: 'bold'}}
                />
              </div>

              <div className="input-group">
                <label><FaTruck /> Vehicle Number:</label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={vehicleNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVehicleNumber(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'driverName')}
                />
              </div>

              <div className="input-group">
                <label><FaUser /> Driver/Owner Name:</label>
                <input
                  type="text"
                  name="driverName"
                  value={driverName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDriverName(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'amount')}
                />
              </div>

              <div className="input-group">
                <label><FaDollarSign /> Amount:</label>
                <input
                  type="number"
                  name="amount"
                  value={amount === 0 ? '' : amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(Number(e.target.value))}
                  onKeyPress={(e) => handleKeyPress(e, 'firstWeight')}
                  onFocus={() => {if(amount === 0) setAmount(0)}}
                />
              </div>

              <div className="weight-input-container">
                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px' }}>
                    <div>
                      <div>First Date: {currentDate}</div>
                      <div>First Time: {currentTime}</div>
                      {secondWeight > 0 && (
                        <>
                          <div>Second Date: {secondDate}</div>
                          <div>Second Time: {secondTime}</div>
                        </>
                      )}
                    </div>
                  </div>
                  <label><FaWeight /> First Weight:</label>
                  <div className="weight-input">
                    <input
                      type="number"
                      name="firstWeight"
                      value={firstWeight === 0 ? '' : firstWeight}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstWeight(Number(e.target.value))}
                      onKeyPress={(e) => handleKeyPress(e, 'secondWeight')}
                      onFocus={() => {if(firstWeight === 0) setFirstWeight(0)}}
                      style={{fontWeight: 'bold', fontSize: '24px'}}
                    />
                    <span>kg</span>
                  </div>
                </div>
              </div>

              <div className="weight-input-container">
                <div className="input-group">
                  <label><FaWeight /> Second Weight:</label>
                  <div className="weight-input">
                    <input
                      type="number"
                      name="secondWeight"
                      value={secondWeight === 0 ? '' : secondWeight}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setSecondWeight(Number(e.target.value));
                        calculateFinalWeight(Number(e.target.value));
                      }}
                      onKeyPress={(e) => handleKeyPress(e, 'save')}
                      onFocus={() => {if(secondWeight === 0) setSecondWeight(0)}}
                      style={{fontWeight: 'bold', fontSize: '24px'}}
                    />
                    <span>kg</span>
                  </div>
                </div>
              </div>

              <div className="weight-grid">
                <div className="input-group">
                  <label><FaWeight /> Final Weight:</label>
                  <div className="weight-input">
                    <input
                      type="number"
                      value={finalWeight}
                      disabled
                      style={{fontWeight: 'bold', fontSize: '24px'}}
                    />
                    <span>kg</span>
                  </div>
                </div>

                <div className="input-group">
                  <label><FaWeight /> Weight per 40:</label>
                  <div className="weight-input">
                    <input
                      type="text"
                      value={weightPer40}
                      disabled
                      style={{fontWeight: 'bold', fontSize: '24px'}}
                    />
                    <span>kg</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="entries-section">
              {searchResult ? (
                <div className="search-result">
                  <h2><FaSearch /> Search Result</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Serial</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>First</th>
                        <th>Second</th>
                        <th>Final</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{searchResult.serialNumber}</td>
                        <td>{searchResult.date}</td>
                        <td>{searchResult.time}</td>
                        <td style={{fontWeight: 'bold'}}>{searchResult.firstWeight}</td>
                        <td style={{fontWeight: 'bold'}}>{searchResult.secondWeight}</td>
                        <td style={{fontWeight: 'bold'}}>{searchResult.finalWeight}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="recent-entries">
                  <h2><FaList /> Recent Entries</h2>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Serial</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>First</th>
                          <th>Second</th>
                          <th>Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {savedEntries.slice(-5).map((entry, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'even' : ''}>
                            <td>{entry.serialNumber}</td>
                            <td>{entry.date}</td>
                            <td>{entry.time}</td>
                            <td style={{fontWeight: 'bold'}}>{entry.firstWeight}</td>
                            <td style={{fontWeight: 'bold'}}>{entry.secondWeight}</td>
                            <td style={{fontWeight: 'bold'}}>{entry.finalWeight}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="button-grid">
            <button onClick={handleNew} onKeyDown={(e) => handleButtonKeyPress(e, 'btn-green')} className="btn btn-blue"><FaPlus /> New</button>
            <button className="btn btn-green" onKeyDown={(e) => handleButtonKeyPress(e, 'btn-purple')}><FaList /> Saved List</button>
            <button ref={saveButtonRef} onClick={handleSave} onKeyDown={(e) => handleButtonKeyPress(e, 'btn-indigo')} className="btn btn-purple"><FaSave /> Save</button>
            <button ref={printButtonRef} onClick={handlePrint} onKeyDown={(e) => handleButtonKeyPress(e, 'btn-gray')} className="btn btn-indigo"><FaPrint /> Print</button>
            <button className="btn btn-gray" onKeyDown={(e) => handleButtonKeyPress(e, 'btn-gray')}><FaCalendarAlt /> List by Date</button>
            <button className="btn btn-gray" onKeyDown={(e) => handleButtonKeyPress(e, 'btn-gray')}><FaTruck /> Entry by Vehicle</button>
            <button className="btn btn-gray" onKeyDown={(e) => handleButtonKeyPress(e, 'btn-gray')}><FaUser /> Entry by Name</button>
            <div className="search-serial">
              <input
                type="text"
                placeholder="Enter Serial Number"
                value={searchSerial}
                onChange={(e) => setSearchSerial(e.target.value)}
              />
              <button onClick={handleSearchBySerial} onKeyDown={(e) => handleButtonKeyPress(e, 'btn-gray')} className="btn btn-gray"><FaSearch /> Entry by Serial</button>
            </div>
          </div>
        </div>

        {notification && (
          <div className="notification">
            {notification}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeightStation;
