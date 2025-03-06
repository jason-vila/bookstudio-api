package com.bookstudio.services;

import java.io.IOException;
import java.io.InputStream;
import java.sql.SQLException;
import java.util.Base64;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.Part;

import com.bookstudio.dao.UserDao;
import com.bookstudio.dao.impl.UserDaoImpl;
import com.bookstudio.models.User;
import com.bookstudio.utils.LoginConstants;

public class UserService {
	private UserDao userDao = new UserDaoImpl();

	public List<User> listUsers(HttpServletRequest request) throws SQLException {
		Object userIdObj = request.getSession().getAttribute(LoginConstants.ID);

		if (userIdObj == null) {
			throw new IllegalStateException("El ID del usuario no está presente en la sesión. Asegúrate de que el usuario esté logueado.");
		}

		int loggedUserId;
		try {
			loggedUserId = Integer.parseInt(userIdObj.toString());
		} catch (NumberFormatException e) {
			throw new IllegalArgumentException("El ID de usuario no es válido: " + userIdObj);
		}

		List<User> userData = userDao.listUsers(loggedUserId);

		for (User user : userData) {
			byte[] photo = user.getProfilePhoto();
			if (photo != null) {
				String photoBase64 = Base64.getEncoder().encodeToString(photo);
				user.setProfilePhotoBase64("data:image/jpeg;base64," + photoBase64);
			}
		}

		return userData;
	}

	public User getUser(String userId) throws SQLException {
		User user = userDao.getUser(userId);
		byte[] photo = user.getProfilePhoto();
		
		if (photo != null) {
			String photoBase64 = Base64.getEncoder().encodeToString(photo);
			user.setProfilePhotoBase64("data:image/jpeg;base64," + photoBase64);
		}
		
		return user;
	}

	public User createUser(HttpServletRequest request) throws Exception {
		String username = getUtf8Parameter(request, "addUserUsername");
		String email = getUtf8Parameter(request, "addUserEmail");
		String firstName = getUtf8Parameter(request, "addUserFirstName");
		String lastName = getUtf8Parameter(request, "addUserLastName");
		String password = getUtf8Parameter(request, "addUserPassword");
		String role = getUtf8Parameter(request, "addUserRole");

		Part photoPart = request.getPart("addUserProfilePhoto");
		byte[] profilePhoto = null;
		if (photoPart != null && photoPart.getSize() > 0) {
			try (InputStream inputStream = photoPart.getInputStream()) {
				profilePhoto = inputStream.readAllBytes();
			}
		}

		User user = new User();
		user.setUsername(username);
		user.setEmail(email);
		user.setFirstName(firstName);
		user.setLastName(lastName);
		user.setPassword(password);
		user.setRole(role);
		user.setProfilePhoto(profilePhoto);

		User createdUser = userDao.createUser(user);

		if (createdUser.getProfilePhoto() != null) {
			String photoBase64 = Base64.getEncoder().encodeToString(createdUser.getProfilePhoto());
			createdUser.setProfilePhotoBase64("data:image/jpeg;base64," + photoBase64);
		}

		return createdUser;
	}

	public User updateUser(HttpServletRequest request) throws Exception {
		String userId = request.getParameter("userId");
		String firstName = getUtf8Parameter(request, "editUserFirstName");
		String lastName = getUtf8Parameter(request, "editUserLastName");
		String password = getUtf8Parameter(request, "editUserPassword");
		String role = getUtf8Parameter(request, "editUserRole");

		Part photoPart = request.getPart("editUserProfilePhoto");
		byte[] profilePhoto = null;
		if (photoPart != null && photoPart.getSize() > 0) {
			try (InputStream inputStream = photoPart.getInputStream()) {
				profilePhoto = inputStream.readAllBytes();
			}
		}

		User user = new User();
		user.setUserId(userId);
		user.setFirstName(firstName);
		user.setLastName(lastName);
		user.setPassword(password);
		user.setRole(role);

		if (profilePhoto == null) {
			User currentUser = userDao.getUser(userId);
			profilePhoto = currentUser.getProfilePhoto();
		}
		user.setProfilePhoto(profilePhoto);

		return userDao.updateUser(user);
	}

	public boolean deleteUser(String userId) throws SQLException {
		return userDao.deleteUser(userId);
	}

	private String getUtf8Parameter(HttpServletRequest request, String fieldName) throws IOException, ServletException {
		Part part = request.getPart(fieldName);
		if (part != null) {
			try (InputStream is = part.getInputStream()) {
				return new String(is.readAllBytes(), "UTF-8");
			}
		}
		
		return "";
	}
}
