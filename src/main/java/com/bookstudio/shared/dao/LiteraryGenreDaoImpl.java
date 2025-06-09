package com.bookstudio.shared.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import com.bookstudio.shared.model.LiteraryGenre;
import com.bookstudio.shared.util.DbConnection;

public class LiteraryGenreDaoImpl implements LiteraryGenreDao {
	@Override
	public List<LiteraryGenre> populateLiteraryGenreSelect() {
		List<LiteraryGenre> literaryGenreList = new ArrayList<>();

		String sql = """
				    SELECT LiteraryGenreID, GenreName
				    FROM LiteraryGenres
				""";

		try (Connection cn = DbConnection.getConexion();
				PreparedStatement ps = cn.prepareStatement(sql);
				ResultSet rs = ps.executeQuery()) {

			while (rs.next()) {
				LiteraryGenre literaryGenre = new LiteraryGenre();
				literaryGenre.setLiteraryGenreId(rs.getString("LiteraryGenreID"));
				literaryGenre.setGenreName(rs.getString("GenreName"));
				literaryGenreList.add(literaryGenre);
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}
		
		return literaryGenreList;
	}
}
