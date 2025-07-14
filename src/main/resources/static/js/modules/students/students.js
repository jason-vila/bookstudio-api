/**
 * students.js
 *
 * Handles the initialization and behavior of the students table,
 * including loading data, configuring modals for creating, viewing,
 * editing, and logically deleting student records.
 *
 * Uses the Fetch API to communicate with RESTful endpoints for all student-related
 * CRUD operations. Manages UI components such as placeholders, enhanced dropdowns,
 * validation feedback, loading states, and tooltips.
 *
 * Also includes features for generating PDF reports and exporting table data to Excel.
 *
 * @author Jason
 */

import {
	loadTableData,
	addRowToTable,
	updateRowInTable,
} from '../../shared/utils/tables/index.js'

import {
	isValidDNI,
	isValidText,
	isValidAddress,
	isValidPhone,
	isValidEmail,
	isValidBirthDate,
	loadSelectOptions,
	populateSelect,
} from '../../shared/utils/forms/index.js'

import {
	showToast,
	toggleButtonLoading,
	toggleModalLoading,
	placeholderColorSelect,
	placeholderColorEditSelect,
	placeholderColorDateInput,
	setupBootstrapSelectDropdownStyles,
	getCurrentPeruDate,
} from '../../shared/utils/ui/index.js'

/*****************************************
 * GLOBAL VARIABLES AND HELPER FUNCTIONS
 *****************************************/

// Global list of faculties for the selectpickers
let facultyList = []

function loadOptions() {
	loadSelectOptions({
		url: './api/students/select-options',
		onSuccess: (data) => {
			facultyList = data.faculties
		},
	})
}

/*****************************************
 * TABLE HANDLING
 *****************************************/

function generateRow(student) {
	return `
		<tr>
			<td class="align-middle text-start">
				<span class="badge bg-body-tertiary text-body-emphasis border">${student.formattedStudentId}</span>
			</td>
			<td class="align-middle text-start">
				<span class="badge bg-body-secondary text-body-emphasis border">${student.dni}</span>
			</td>
			<td class="align-middle text-start">${student.firstName}</td>
			<td class="align-middle text-start">${student.lastName}</td>
			<td class="align-middle text-start">
				<span class="badge bg-body-secondary text-body-emphasis border">${student.phone}</span>
			</td>
			<td class="align-middle text-start">${student.email}</td>
			<td class="align-middle text-center">
				${
					student.status === 'activo'
						? '<span class="badge text-success-emphasis bg-success-subtle border border-success-subtle">Activo</span>'
						: '<span class="badge text-danger-emphasis bg-danger-subtle border border-danger-subtle">Inactivo</span>'
				}
			</td>
			<td class="align-middle text-center">
				<div class="d-inline-flex gap-2">
					<button class="btn btn-sm btn-icon-hover" data-tooltip="tooltip" data-bs-placement="top" title="Detalles"
						data-bs-toggle="modal" data-bs-target="#detailsStudentModal" data-id="${student.studentId}" data-formatted-id="${student.formattedStudentId}">
						<i class="bi bi-info-circle"></i>
					</button>
					<button class="btn btn-sm btn-icon-hover" data-tooltip="tooltip" data-bs-placement="top" title="Editar"
						data-bs-toggle="modal" data-bs-target="#editStudentModal" data-id="${student.studentId}" data-formatted-id="${student.formattedStudentId}">
						<i class="bi bi-pencil"></i>
					</button>
				</div>
			</td>
		</tr>
	`
}

function addRow(student) {
	addRowToTable(student, generateRow)
}

function loadData() {
	loadTableData({
		apiUrl: './api/students',
		generateRow,
		generatePDF,
		generateExcel,
	})
}

function updateRow(student) {
	updateRowInTable({
		entity: student,
		getFormattedId: (s) => s.formattedStudentId?.toString(),
		updateCellsFn: (row, s) => {
			row.find('td').eq(2).text(s.firstName)
			row.find('td').eq(3).text(s.lastName)
			row.find('td').eq(4).find('span').text(s.phone)
			row.find('td').eq(5).text(s.email)
			row
				.find('td')
				.eq(6)
				.html(
					s.status === 'activo'
						? '<span class="badge text-success-emphasis bg-success-subtle border border-success-subtle">Activo</span>'
						: '<span class="badge text-danger-emphasis bg-danger-subtle border border-danger-subtle">Inactivo</span>',
				)
		},
	})
}

/*****************************************
 * FORM LOGIC
 *****************************************/

function handleAddForm() {
	let isFirstSubmit = true

	$('#addStudentModal').on('hidden.bs.modal', function () {
		isFirstSubmit = true
		$('#addStudentForm').data('submitted', false)
	})

	$('#addStudentForm').on('input change', 'input, select', function () {
		if (!isFirstSubmit) {
			validateAddField($(this))
		}
	})

	$('#addStudentForm').on('submit', async function (event) {
		event.preventDefault()

		if ($(this).data('submitted') === true) return
		$(this).data('submitted', true)

		if (isFirstSubmit) isFirstSubmit = false

		const form = this
		let isValid = true

		$(form)
			.find('input, select')
			.not('.bootstrap-select input[type="search"]')
			.each(function () {
				if (!validateAddField($(this))) isValid = false
			})

		if (!isValid) {
			$(form).data('submitted', false)
			return
		}

		const formData = new FormData(form)
		const raw = Object.fromEntries(formData.entries())

		const student = {
			dni: raw.addStudentDNI,
			firstName: raw.addStudentFirstName,
			lastName: raw.addStudentLastName,
			address: raw.addStudentAddress,
			phone: raw.addStudentPhone,
			email: raw.addStudentEmail,
			birthDate: raw.addStudentBirthDate,
			gender: raw.addStudentGender,
			facultyId: parseInt(raw.addStudentFaculty),
			status: raw.addStudentStatus,
		}

		const submitButton = $('#addStudentBtn')
		toggleButtonLoading(submitButton, true)

		try {
			const response = await fetch('./api/students', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify(student),
			})

			const json = await response.json()

			if (response.ok && json.success) {
				addRow(json.data)
				$('#addStudentModal').modal('hide')
				showToast('Estudiante agregado exitosamente.', 'success')
			} else if (
				response.status === 400 &&
				json.errorType === 'validation_error'
			) {
				if (json.errors && Array.isArray(json.errors)) {
					json.errors.forEach((err) => {
						setFieldError(err.field, err.message)
					})
				} else {
					console.warn('Validation error sin detalles de campos:', json)
				}
				$('#addStudentForm').data('submitted', false)
			} else {
				console.error(
					`Backend error (${json.errorType} - ${json.statusCode}):`,
					json.message,
				)
				showToast(
					json.message || 'Hubo un error al agregar el estudiante.',
					'error',
				)
				$('#addStudentModal').modal('hide')
			}
		} catch (err) {
			console.error('Unexpected error:', err)
			showToast('Hubo un error inesperado.', 'error')
			$('#addStudentModal').modal('hide')
		} finally {
			toggleButtonLoading(submitButton, false)
		}
	})

	function setFieldError(fieldId, message) {
		const field = $('#' + fieldId)
		field.addClass('is-invalid')
		field.siblings('.invalid-feedback').html(message).show()
	}
}

function validateAddField(field) {
	if (field.attr('type') === 'search') {
		return true
	}

	let errorMessage = 'Este campo es obligatorio.'
	let isValid = true

	// Default validation
	if (!field.val() || (field[0].checkValidity && !field[0].checkValidity())) {
		field.addClass('is-invalid')
		field.siblings('.invalid-feedback').html(errorMessage)
		isValid = false
	} else {
		field.removeClass('is-invalid')
	}

	// DNI validation
	if (field.is('#addStudentDNI')) {
		const result = isValidDNI(field.val())
		if (!result.valid) {
			errorMessage = result.message
			isValid = false
		}
	}

	// Name validation
	if (field.is('#addStudentFirstName')) {
		const result = isValidText(field.val(), 'nombre')
		if (!result.valid) {
			isValid = false
			errorMessage = result.message
		}
	}

	// Last name validation
	if (field.is('#addStudentLastName')) {
		const result = isValidText(field.val(), 'apellido')
		if (!result.valid) {
			isValid = false
			errorMessage = result.message
		}
	}

	// Address validation
	if (field.is('#addStudentAddress')) {
		const result = isValidAddress(field.val())
		if (!result.valid) {
			errorMessage = result.message
			isValid = false
		}
	}

	// Phone validation
	if (field.is('#addStudentPhone')) {
		const result = isValidPhone(field.val())
		if (!result.valid) {
			errorMessage = result.message
			isValid = false
		}
	}

	// Email validation
	if (field.is('#addStudentEmail')) {
		const result = isValidEmail(field.val())
		if (!result.valid) {
			errorMessage = result.message
			isValid = false
		}
	}

	// Birthdate validation
	if (field.is('#addStudentBirthDate')) {
		const result = isValidBirthDate(field.val())
		if (!result.valid) {
			isValid = false
			errorMessage = result.message
		}
	}

	// Select validation
	if (field.is('select')) {
		const container = field.closest('.bootstrap-select')
		container.toggleClass('is-invalid', field.hasClass('is-invalid'))
		container.siblings('.invalid-feedback').html(errorMessage)
	}

	if (!isValid) {
		field.addClass('is-invalid')
		field.siblings('.invalid-feedback').html(errorMessage).show()
	} else {
		field.removeClass('is-invalid')
		field.siblings('.invalid-feedback').hide()
	}

	return isValid
}

function handleEditForm() {
	let isFirstSubmit = true

	$('#editStudentModal').on('hidden.bs.modal', function () {
		isFirstSubmit = true
		$('#editStudentForm').data('submitted', false)
	})

	$('#editStudentForm').on('input change', 'input, select', function () {
		if (!isFirstSubmit) {
			validateEditField($(this))
		}
	})

	$('#editStudentForm').on('submit', async function (event) {
		event.preventDefault()

		if ($(this).data('submitted') === true) return
		$(this).data('submitted', true)

		if (isFirstSubmit) isFirstSubmit = false

		const form = this
		let isValid = true

		$(form)
			.find('input, select')
			.not('.bootstrap-select input[type="search"]')
			.each(function () {
				if (!validateEditField($(this))) isValid = false
			})

		if (!isValid) {
			$(this).data('submitted', false)
			return
		}

		const studentId = $('#editStudentForm').data('studentId')
		const formData = new FormData(form)
		const raw = Object.fromEntries(formData.entries())

		const student = {
			studentId: parseInt(studentId),
			firstName: raw.editStudentFirstName,
			lastName: raw.editStudentLastName,
			address: raw.editStudentAddress,
			phone: raw.editStudentPhone,
			email: raw.editStudentEmail,
			birthDate: raw.editStudentBirthDate,
			gender: raw.editStudentGender,
			facultyId: parseInt(raw.editStudentFaculty),
			status: raw.editStudentStatus,
		}

		const submitButton = $('#editStudentBtn')
		toggleButtonLoading(submitButton, true)

		try {
			const response = await fetch('./api/students', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify(student),
			})

			const json = await response.json()

			if (response.ok && json.success) {
				updateRow(json.data)
				$('#editStudentModal').modal('hide')
				showToast('Estudiante actualizado exitosamente.', 'success')
			} else if (
				response.status === 400 &&
				json.errorType === 'validation_error'
			) {
				if (json.errors && Array.isArray(json.errors)) {
					json.errors.forEach((err) => {
						setFieldError(err.field, err.message)
					})
				} else {
					console.warn('Validation error sin detalles de campos:', json)
				}
				$('#editStudentForm').data('submitted', false)
			} else {
				console.error(
					`Backend error (${json.errorType} - ${json.statusCode}):`,
					json.message,
				)
				showToast(
					json.message || 'Hubo un error al actualizar el estudiante.',
					'error',
				)
				$('#editStudentModal').modal('hide')
			}
		} catch (err) {
			console.error('Unexpected error:', err)
			showToast('Hubo un error inesperado.', 'error')
			$('#editStudentModal').modal('hide')
		} finally {
			toggleButtonLoading(submitButton, false)
		}
	})

	function setFieldError(fieldId, message) {
		const field = $('#' + fieldId)
		field.addClass('is-invalid')
		field.siblings('.invalid-feedback').html(message).show()
	}
}

function validateEditField(field) {
	if (field.attr('type') === 'search') {
		return true
	}

	let errorMessage = 'Este campo es obligatorio.'
	let isValid = true

	// Default validation
	if (!field.val() || (field[0].checkValidity && !field[0].checkValidity())) {
		field.addClass('is-invalid')
		field.siblings('.invalid-feedback').html(errorMessage)
		isValid = false
	} else {
		field.removeClass('is-invalid')
	}

	// Name validation
	if (field.is('#editStudentFirstName')) {
		const result = isValidText(field.val(), 'nombre')
		if (!result.valid) {
			isValid = false
			errorMessage = result.message
		}
	}

	// Last name validation
	if (field.is('#editStudentLastName')) {
		const result = isValidText(field.val(), 'apellido')
		if (!result.valid) {
			isValid = false
			errorMessage = result.message
		}
	}

	// Address validation
	if (field.is('#editStudentAddress')) {
		const result = isValidAddress(field.val())
		if (!result.valid) {
			errorMessage = result.message
			isValid = false
		}
	}

	// Phone validation
	if (field.is('#editStudentPhone')) {
		const result = isValidPhone(field.val())
		if (!result.valid) {
			errorMessage = result.message
			isValid = false
		}
	}

	// Email validation
	if (field.is('#editStudentEmail')) {
		const result = isValidEmail(field.val())
		if (!result.valid) {
			errorMessage = result.message
			isValid = false
		}
	}

	// Birthdate validation
	if (field.is('#editStudentBirthDate')) {
		const result = isValidBirthDate(field.val())
		if (!result.valid) {
			isValid = false
			errorMessage = result.message
		}
	}

	// Select validation
	if (field.is('select')) {
		const container = field.closest('.bootstrap-select')
		container.toggleClass('is-invalid', field.hasClass('is-invalid'))
		container
			.siblings('.invalid-feedback')
			.html('Opción seleccionada inactiva o no existente.')
	}

	if (!isValid) {
		field.addClass('is-invalid')
		field.siblings('.invalid-feedback').html(errorMessage).show()
	} else {
		field.removeClass('is-invalid')
		field.siblings('.invalid-feedback').hide()
	}

	return isValid
}

/*****************************************
 * MODAL MANAGEMENT
 *****************************************/

function loadModalData() {
	// Add Modal
	$(document).on('click', '[data-bs-target="#addStudentModal"]', function () {
		$('#addStudentGender')
			.selectpicker('destroy')
			.empty()
			.append(
				$('<option>', {
					value: 'Masculino',
					text: 'Masculino',
				}),
				$('<option>', {
					value: 'Femenino',
					text: 'Femenino',
				}),
			)
		$('#addStudentGender').selectpicker()

		populateSelect('#addStudentFaculty', facultyList, 'facultyId', 'name')
		$('#addStudentFaculty').selectpicker()

		$('#addStudentStatus')
			.selectpicker('destroy')
			.empty()
			.append(
				$('<option>', {
					value: 'activo',
					text: 'Activo',
				}),
				$('<option>', {
					value: 'inactivo',
					text: 'Inactivo',
				}),
			)
		$('#addStudentStatus').selectpicker()

		$('#addStudentForm')[0].reset()
		$('#addStudentForm .is-invalid').removeClass('is-invalid')

		const todayPeru = getCurrentPeruDate()
		const maxDateStr = todayPeru.toISOString().split('T')[0]
		$('#addStudentBirthDate').attr('max', maxDateStr)

		placeholderColorDateInput()
	})

	// Details Modal
	$(document).on(
		'click',
		'[data-bs-target="#detailsStudentModal"]',
		function () {
			const studentId = $(this).data('id')
			$('#detailsStudentModalID').text($(this).data('formatted-id'))

			toggleModalLoading(this, true)

			fetch(`./api/students/${encodeURIComponent(studentId)}`, {
				method: 'GET',
				headers: {
					Accept: 'application/json',
				},
			})
				.then(async (response) => {
					if (!response.ok) {
						const errorData = await response.json()
						throw { status: response.status, ...errorData }
					}
					return response.json()
				})
				.then((data) => {
					$('#detailsStudentID').text(data.formattedStudentId)
					$('#detailsStudentDNI').text(data.dni)
					$('#detailsStudentFirstName').text(data.firstName)
					$('#detailsStudentLastName').text(data.lastName)
					$('#detailsStudentAddress').text(data.address)
					$('#detailsStudentPhone').text(data.phone)
					$('#detailsStudentEmail').text(data.email)
					$('#detailsStudentBirthDate').text(
						moment(data.birthDate).format('DD MMM YYYY'),
					)
					$('#detailsStudentGender').text(data.gender)
					$('#detailsStudentFaculty').text(data.facultyName)

					$('#detailsStudentStatus').html(
						data.status === 'activo'
							? '<span class="badge text-success-emphasis bg-success-subtle border border-success-subtle">Activo</span>'
							: '<span class="badge text-danger-emphasis bg-danger-subtle border border-danger-subtle">Inactivo</span>',
					)

					toggleModalLoading(this, false)
				})
				.catch((error) => {
					console.error(
						`Error loading student details (${error.errorType || 'unknown'} - ${error.status}):`,
						error.message || error,
					)
					showToast(
						'Hubo un error al cargar los detalles del estudiante.',
						'error',
					)
					$('#detailsStudentModal').modal('hide')
				})
		},
	)

	// Edit Modal
	$(document).on('click', '[data-bs-target="#editStudentModal"]', function () {
		const studentId = $(this).data('id')
		$('#editStudentModalID').text($(this).data('formatted-id'))

		toggleModalLoading(this, true)

		fetch(`./api/students/${encodeURIComponent(studentId)}`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
			},
		})
			.then(async (response) => {
				if (!response.ok) {
					const errorData = await response.json()
					throw { status: response.status, ...errorData }
				}
				return response.json()
			})
			.then((data) => {
				$('#editStudentForm').data('studentId', data.studentId)
				$('#editStudentDNI').val(data.dni)
				$('#editStudentFirstName').val(data.firstName)
				$('#editStudentLastName').val(data.lastName)
				$('#editStudentAddress').val(data.address)
				$('#editStudentPhone').val(data.phone)
				$('#editStudentEmail').val(data.email)
				$('#editStudentBirthDate').val(
					moment(data.birthDate).format('YYYY-MM-DD'),
				)

				const todayPeru = getCurrentPeruDate()
				const maxDateStr = todayPeru.toISOString().split('T')[0]
				$('#editStudentBirthDate').attr('max', maxDateStr)

				$('#editStudentGender')
					.selectpicker('destroy')
					.empty()
					.append(
						$('<option>', { value: 'Masculino', text: 'Masculino' }),
						$('<option>', { value: 'Femenino', text: 'Femenino' }),
					)
				$('#editStudentGender').val(data.gender)
				$('#editStudentGender').selectpicker()

				populateSelect('#editStudentFaculty', facultyList, 'facultyId', 'name')
				$('#editStudentFaculty').val(data.facultyId)
				$('#editStudentFaculty').selectpicker()

				$('#editStudentStatus')
					.selectpicker('destroy')
					.empty()
					.append(
						$('<option>', { value: 'activo', text: 'Activo' }),
						$('<option>', { value: 'inactivo', text: 'Inactivo' }),
					)
				$('#editStudentStatus').val(data.status)
				$('#editStudentStatus').selectpicker()

				$('#editStudentForm .is-invalid').removeClass('is-invalid')
				placeholderColorEditSelect()
				placeholderColorDateInput()

				$('#editStudentForm')
					.find('select')
					.each(function () {
						validateEditField($(this), true)
					})

				toggleModalLoading(this, false)
			})
			.catch((error) => {
				console.error(
					`Error loading student details for editing (${error.errorType || 'unknown'} - ${error.status}):`,
					error.message || error,
				)
				showToast('Hubo un error al cargar los datos del estudiante.', 'error')
				$('#editStudentModal').modal('hide')
			})
	})
}

function generatePDF(dataTable) {
	const pdfBtn = $('#generatePDF')
	toggleButtonLoading(pdfBtn, true)

	let hasWarnings = false

	try {
		const { jsPDF } = window.jspdf
		const doc = new jsPDF('l', 'mm', 'a4')
		const logoUrl = '/images/bookstudio-logo-no-bg.png'

		const currentDate = new Date()
		const fecha = currentDate.toLocaleDateString('es-ES', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
		})
		const hora = currentDate.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true,
		})

		const pageWidth = doc.internal.pageSize.getWidth()
		const margin = 10
		const topMargin = 5

		try {
			doc.addImage(logoUrl, 'PNG', margin, topMargin - 5, 30, 30)
		} catch (imgError) {
			console.warn('Logo not available:', imgError)
			showToast('No se pudo cargar el logo. Se continuará sin él.', 'warning')
			hasWarnings = true
		}

		doc.setFont('helvetica', 'bold')
		doc.setFontSize(14)
		doc.text('Lista de estudiantes', pageWidth / 2, topMargin + 13, {
			align: 'center',
		})

		doc.setFont('helvetica', 'normal')
		doc.setFontSize(8)
		doc.text(`Fecha: ${fecha}`, pageWidth - margin, topMargin + 10, {
			align: 'right',
		})
		doc.text(`Hora: ${hora}`, pageWidth - margin, topMargin + 15, {
			align: 'right',
		})

		const data = dataTable
			.rows({ search: 'applied' })
			.nodes()
			.toArray()
			.map((row) => {
				let estado = row.cells[6].innerText.trim()
				estado = estado.includes('Activo') ? 'Activo' : 'Inactivo'

				return [
					row.cells[0].innerText.trim(),
					row.cells[1].innerText.trim(),
					row.cells[2].innerText.trim(),
					row.cells[3].innerText.trim(),
					row.cells[4].innerText.trim(),
					row.cells[5].innerText.trim(),
					estado,
				]
			})

		doc.autoTable({
			startY: topMargin + 25,
			margin: { left: margin, right: margin },
			head: [
				[
					'Código',
					'DNI',
					'Nombres',
					'Apellidos',
					'Teléfono',
					'Correo electrónico',
					'Estado',
				],
			],
			body: data,
			theme: 'grid',
			headStyles: {
				fillColor: [0, 0, 0],
				textColor: 255,
				fontStyle: 'bold',
				fontSize: 8,
				halign: 'left',
			},
			bodyStyles: {
				font: 'helvetica',
				fontSize: 7,
				halign: 'left',
			},
			didParseCell: function (data) {
				if (data.section === 'body' && data.column.index === 6) {
					data.cell.styles.textColor =
						data.cell.raw === 'Activo' ? [0, 128, 0] : [255, 0, 0]
				}
			},
		})

		const filename = `Lista_de_estudiantes_bookstudio_${fecha.replace(/\s+/g, '_')}.pdf`

		const pdfBlob = doc.output('blob')
		const blobUrl = URL.createObjectURL(pdfBlob)
		const link = document.createElement('a')
		link.href = blobUrl
		link.download = filename
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)

		if (!hasWarnings) {
			showToast('PDF generado exitosamente.', 'success')
		}
	} catch (error) {
		console.error('Error generating PDF file:', error)
		showToast(
			'Ocurrió un error al generar el PDF. Inténtalo nuevamente.',
			'error',
		)
	} finally {
		toggleButtonLoading(pdfBtn, false)
	}
}

function generateExcel(dataTable) {
	const excelBtn = $('#generateExcel')
	toggleButtonLoading(excelBtn, true)

	try {
		const workbook = new ExcelJS.Workbook()
		const worksheet = workbook.addWorksheet('Estudiantes')

		const currentDate = new Date()
		const dateStr = currentDate.toLocaleDateString('es-ES', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
		})
		const timeStr = currentDate.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true,
		})

		worksheet.mergeCells('A1:G1')
		const titleCell = worksheet.getCell('A1')
		titleCell.value = 'Lista de estudiantes - BookStudio'
		titleCell.font = { name: 'Arial', size: 14, bold: true }
		titleCell.alignment = { horizontal: 'center' }

		worksheet.mergeCells('A2:G2')
		const dateTimeCell = worksheet.getCell('A2')
		dateTimeCell.value = `Fecha: ${dateStr}  Hora: ${timeStr}`
		dateTimeCell.alignment = { horizontal: 'center' }

		worksheet.columns = [
			{ key: 'id', width: 10 },
			{ key: 'dni', width: 15 },
			{ key: 'nombres', width: 30 },
			{ key: 'apellidos', width: 30 },
			{ key: 'telefono', width: 20 },
			{ key: 'correo', width: 30 },
			{ key: 'estado', width: 15 },
		]

		const headerRow = worksheet.getRow(4)
		headerRow.values = [
			'Código',
			'DNI',
			'Nombres',
			'Apellidos',
			'Teléfono',
			'Correo electrónico',
			'Estado',
		]
		headerRow.eachCell((cell) => {
			cell.font = { bold: true, color: { argb: 'FFFFFF' } }
			cell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: '000000' },
			}
			cell.alignment = { horizontal: 'left', vertical: 'middle' }
			cell.border = {
				top: { style: 'thin', color: { argb: 'FFFFFF' } },
				bottom: { style: 'thin', color: { argb: 'FFFFFF' } },
				left: { style: 'thin', color: { argb: 'FFFFFF' } },
				right: { style: 'thin', color: { argb: 'FFFFFF' } },
			}
		})

		const data = dataTable
			.rows({ search: 'applied' })
			.nodes()
			.toArray()
			.map((row) => {
				let estado = row.cells[6].innerText.trim()
				estado = estado.includes('Activo') ? 'Activo' : 'Inactivo'

				return {
					id: row.cells[0].innerText.trim(),
					dni: row.cells[1].innerText.trim(),
					nombres: row.cells[2].innerText.trim(),
					apellidos: row.cells[3].innerText.trim(),
					telefono: row.cells[4].innerText.trim(),
					correo: row.cells[5].innerText.trim(),
					estado: estado,
				}
			})

		data.forEach((item) => {
			const row = worksheet.addRow(item)
			const estadoCell = row.getCell(7)
			if (estadoCell.value === 'Activo') {
				estadoCell.font = { color: { argb: '008000' } }
				estadoCell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'E6F2E6' },
				}
			} else {
				estadoCell.font = { color: { argb: 'FF0000' } }
				estadoCell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'FFE6E6' },
				}
			}
		})

		const filename = `Lista_de_estudiantes_bookstudio_${dateStr.replace(/\s+/g, '_')}.xlsx`

		workbook.xlsx
			.writeBuffer()
			.then((buffer) => {
				const blob = new Blob([buffer], {
					type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				})
				const link = document.createElement('a')
				link.href = URL.createObjectURL(blob)
				link.download = filename
				link.click()

				showToast('Excel generado exitosamente.', 'success')
			})
			.catch((error) => {
				console.error('Error generating Excel file:', error)
				showToast('Ocurrió un error al generar el Excel.', 'error')
			})
			.finally(() => {
				toggleButtonLoading(excelBtn, false)
			})
	} catch (error) {
		console.error('General error while generating Excel file:', error)
		showToast('Ocurrió un error inesperado al generar el Excel.', 'error')
		toggleButtonLoading(excelBtn, false)
	}
}

/*****************************************
 * INITIALIZATION
 *****************************************/

$(document).ready(function () {
	loadData()
	handleAddForm()
	handleEditForm()
	loadModalData()
	loadOptions()
	$('.selectpicker').selectpicker()
	setupBootstrapSelectDropdownStyles()
	placeholderColorSelect()
})
