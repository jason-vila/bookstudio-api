package com.bookstudio.shared.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import com.bookstudio.shared.model.Genre;
import com.bookstudio.shared.util.DbConnection;

public class GenreDaoImpl implements GenreDao {
	@Override
	public List<Genre> populateGenreSelect() {
		List<Genre> genreList = new ArrayList<>();

		String sql = """
				    SELECT GenreID, GenreName
				    FROM Genres
				""";

		try (Connection cn = DbConnection.getConexion();
				PreparedStatement ps = cn.prepareStatement(sql);
				ResultSet rs = ps.executeQuery()) {

			while (rs.next()) {
				Genre genre = new Genre();
				genre.setGenreId(rs.getString("GenreID"));
				genre.setGenreName(rs.getString("GenreName"));
				genreList.add(genre);
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}
		
		return genreList;
	}
}
