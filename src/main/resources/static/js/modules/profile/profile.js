/**
 * profile.js
 *
 * Manages user profile updates, including photo cropping, password validation, and general profile editing.
 * Handles profile data and image updates using the Fetch API to interact with RESTful endpoints,
 * including validation and error handling for password changes.
 *
 * @author Jason
 */

import { showToast } from '../../shared/utils/ui/index.js'

import {
	isValidText,
	isValidPassword,
} from '../../shared/utils/validators/index.js'

$(document).ready(function () {
	/************** Logic for Profile Photo **************/
	let croppedImageBlob = null
	let cropper

	$('#currentPassword, #password').on('input', function () {
		const inputElement = this
		const cursorPosition = inputElement.selectionStart
		const originalValue = $(this).val()
		const newValue = originalValue.replace(/\s/g, '')

		if (originalValue !== newValue) {
			$(this).val(newValue)
			const spacesRemoved = (
				originalValue.slice(0, cursorPosition).match(/\s/g) || []
			).length
			inputElement.setSelectionRange(
				cursorPosition - spacesRemoved,
				cursorPosition - spacesRemoved,
			)
		}
	})

	$('#cropperModal').on('shown.bs.modal', function () {
		if (cropper) {
			cropper.destroy()
			cropper = null
		}
		cropper = new Cropper(document.getElementById('cropperImage'), {
			aspectRatio: 1,
			viewMode: 1,
			autoCropArea: 1,
			responsive: true,
			ready: function () {
				$('.cropper-crop-box').css({
					'border-radius': '50%',
					overflow: 'hidden',
				})
			},
		})
	})

	$('#cropperModal').on('hidden.bs.modal', function () {
		if (cropper) {
			cropper.destroy()
			cropper = null
		}
	})

	// When a photo is selected in the profile photo input
	$('#editProfilePhoto').on('change', function () {
		const file = this.files[0]
		if (!file) return

		const validExtensions = [
			'image/jpeg',
			'image/png',
			'image/gif',
			'image/webp',
		]

		if (!validExtensions.includes(file.type)) {
			showToast(
				'Solo se permiten imágenes en formato JPG, PNG, GIF o WEBP.',
				'error',
			)

			$(this).val('')
			return
		}

		const reader = new FileReader()
		reader.onload = function (e) {
			$('#cropperImage').attr('src', e.target.result)
			$('#cropperModal').modal('show')
		}

		reader.readAsDataURL(file)
	})

	// When "Save" is clicked in the cropper modal
	$('#saveCroppedImage').on('click', function () {
		if ($(this).prop('disabled')) return

		$(this).prop('disabled', true)
		$('#savePhotoIcon').addClass('d-none')
		$('#savePhotoSpinner').removeClass('d-none')

		if (!cropper) return
		const canvas = cropper.getCroppedCanvas({
			width: 460,
			height: 460,
		})

		canvas.toBlob(function (blob) {
			croppedImageBlob = blob
			const photoFormData = new FormData($('#editProfilePhotoForm')[0])
			photoFormData.delete('editProfilePhoto')

			photoFormData.append(
				'editProfilePhoto',
				croppedImageBlob,
				'croppedImage.png',
			)
			photoFormData.append('deletePhoto', 'false')

			fetch('/api/profile/update-photo', {
				method: 'POST',
				body: photoFormData,
			})
				.then((res) => res.json())
				.then((data) => {
					if (data.success) {
						sessionStorage.setItem(
							'toastMessage',
							'Foto de perfil subida exitosamente.',
						)
						sessionStorage.setItem('toastType', 'success')
						window.location.href = 'profile'
					} else {
						showToast(data.message || 'Error al actualizar la foto.', 'error')
					}
				})
				.catch(() => {
					showToast('Error al actualizar la foto.', 'error')
					$('#cropperModal').modal('hide')
				})
				.finally(() => {
					$('#savePhotoIcon').removeClass('d-none')
					$('#savePhotoSpinner').addClass('d-none')
				})
		})
	})

	// Reset button state when the modal is hidden
	$('#cropperModal').on('hidden.bs.modal', function () {
		$('#saveCroppedImage').prop('disabled', false)
		$('#savePhotoIcon').removeClass('d-none')
		$('#savePhotoSpinner').addClass('d-none')
	})

	// Confirm photo deletion
	$('#confirmDeletePhoto').on('click', function () {
		if ($(this).prop('disabled')) return

		$(this).prop('disabled', true)
		$('#deletePhotoIcon').addClass('d-none')
		$('#deletePhotoSpinner').removeClass('d-none')

		const photoFormData = new FormData()
		photoFormData.append('deletePhoto', 'true')

		fetch('/api/profile/update-photo', {
			method: 'POST',
			body: photoFormData,
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.success) {
					sessionStorage.setItem(
						'toastMessage',
						'Foto de perfil eliminada exitosamente.',
					)
					sessionStorage.setItem('toastType', 'success')
					window.location.href = 'profile'
				} else {
					showToast(data.message || 'Error al eliminar la foto.', 'error')
				}
			})
			.catch(() => {
				showToast('Error al eliminar la foto.', 'error')
				$('#deletePhotoModal').modal('hide')
			})
			.finally(() => {
				$('#deletePhotoIcon').removeClass('d-none')
				$('#deletePhotoSpinner').addClass('d-none')
			})
	})

	// Reset button state when the modal is hidden
	$('#deletePhotoModal').on('hidden.bs.modal', function () {
		$('#confirmDeletePhoto').prop('disabled', false)
		$('#deletePhotoIcon').removeClass('d-none')
		$('#deletePhotoSpinner').addClass('d-none')
	})

	/************** Profile update logic **************/
	function validateProfileFirstName() {
		const result = isValidText($('#firstName').val(), 'nombre')
		if (!result.valid) {
			$('#firstName').addClass('is-invalid')
			$('#firstName').siblings('.invalid-feedback').text(result.message)
			return false
		} else {
			$('#firstName').removeClass('is-invalid')
			$('#firstName').siblings('.invalid-feedback').text('')
			return true
		}
	}

	function validateProfileLastName() {
		const result = isValidText($('#lastName').val(), 'apellido')
		if (!result.valid) {
			$('#lastName').addClass('is-invalid')
			$('#lastName').siblings('.invalid-feedback').text(result.message)
			return false
		} else {
			$('#lastName').removeClass('is-invalid')
			$('#lastName').siblings('.invalid-feedback').text('')
			return true
		}
	}

	function validateNewPassword() {
		const newPassword = $('#password').val().trim()
		const result = isValidPassword(newPassword)

		if (!result.valid) {
			$('#password').addClass('is-invalid')
			$('#password').siblings('.invalid-feedback').text(result.message)
			return false
		} else {
			$('#password').removeClass('is-invalid')
			$('#password').siblings('.invalid-feedback').text('')
			return true
		}
	}

	$('#firstName').on('input', function () {
		validateProfileFirstName()
	})

	$('#lastName').on('input', function () {
		validateProfileLastName()
	})

	$('#currentPassword').on('input', function () {
		$(this).removeClass('is-invalid')
		$(this).siblings('.invalid-feedback').text('')
	})

	$('#password').on('input', function () {
		validateNewPassword()
	})

	// Handle profile update form submission
	$('#editProfileForm').on('submit', async function (event) {
		event.preventDefault()

		const firstNameValid = validateProfileFirstName()
		const lastNameValid = validateProfileLastName()

		if (!firstNameValid || !lastNameValid) {
			return
		}

		const currentPassword = $('#currentPassword').val().trim()
		const newPassword = $('#password').val().trim()

		// Construye el cuerpo manualmente, solo lo necesario
		let data = ''
		data += 'firstName=' + encodeURIComponent($('#firstName').val().trim())
		data += '&lastName=' + encodeURIComponent($('#lastName').val().trim())

		if (currentPassword && !newPassword) {
			$('#password').addClass('is-invalid')
			$('#password')
				.siblings('.invalid-feedback')
				.text('Debes ingresar tu contraseña nueva.')
			return
		}

		if (newPassword) {
			if (!validateNewPassword()) {
				return
			}
			if (!currentPassword) {
				$('#currentPassword').addClass('is-invalid')
				$('#currentPassword')
					.siblings('.invalid-feedback')
					.text('Debes ingresar tu contraseña actual.')
				return
			}

			try {
				const res = await fetch(
					`/api/profile/validate-password?currentPassword=${encodeURIComponent(currentPassword)}`,
				)
				const response = await res.json()

				if (response && response.success) {
					$('#currentPassword').removeClass('is-invalid')
					$('#currentPassword').siblings('.invalid-feedback').text('')
					data += '&password=' + encodeURIComponent(newPassword)
					submitProfileForm(data)
				} else {
					$('#currentPassword').addClass('is-invalid')
					$('#currentPassword')
						.siblings('.invalid-feedback')
						.text(response.message || 'La contraseña actual no es correcta.')
				}
			} catch {
				$('#currentPassword').addClass('is-invalid')
				$('#currentPassword')
					.siblings('.invalid-feedback')
					.text('Ocurrió un error inesperado al validar la contraseña.')
			}
		} else {
			submitProfileForm(data)
		}
	})

	let formSubmitted = false

	// Submit profile form
	async function submitProfileForm(data) {
		if (formSubmitted) return
		formSubmitted = true

		$('#updateProfileBtn').prop('disabled', true)
		$('#updateProfileSpinner').removeClass('d-none')
		$('#updateProfileText').addClass('d-none')

		try {
			const response = await fetch('/api/profile/update-profile', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: data,
				credentials: 'include',
			})

			const result = await response.json()

			if (result.success) {
				sessionStorage.setItem(
					'toastMessage',
					'Perfil actualizado exitosamente.',
				)
				sessionStorage.setItem('toastType', 'success')
				window.location.href = 'profile'
			} else {
				showToast(result.message || 'Error al actualizar el perfil.', 'error')
				formSubmitted = false
			}
		} catch {
			showToast('Ocurrió un error inesperado.', 'error')
			formSubmitted = false
		} finally {
			$('#updateProfileBtn').prop('disabled', false)
			$('#updateProfileSpinner').addClass('d-none')
			$('#updateProfileText').removeClass('d-none')
		}
	}

	// Check messages to show toasts
	$(document).ready(function () {
		const toastMessage = sessionStorage.getItem('toastMessage')
		const toastType = sessionStorage.getItem('toastType')

		if (toastMessage && toastType) {
			showToast(toastMessage, toastType)
			sessionStorage.removeItem('toastMessage')
			sessionStorage.removeItem('toastType')
		}
	})

	// Enable or disable the update profile button
	const originalFirstName = $('#firstName').val()
	const originalLastName = $('#lastName').val()

	function checkChanges() {
		const currentFirstName = $('#firstName').val()
		const currentLastName = $('#lastName').val()
		const currentPassword = $('#currentPassword').val().trim()
		const newPassword = $('#password').val().trim()

		const nameChanged =
			currentFirstName !== originalFirstName ||
			currentLastName !== originalLastName
		const passwordChanged = newPassword !== '' || currentPassword !== ''

		if (nameChanged || passwordChanged) {
			$('#editProfileForm button[type=submit]').prop('disabled', false)
		} else {
			$('#editProfileForm button[type=submit]').prop('disabled', true)
		}
	}

	$('#firstName, #lastName, #currentPassword, #password').on(
		'input',
		checkChanges,
	)
})
