FROM tomcat:8.5-jdk21

RUN rm -rf /usr/local/tomcat/webapps/*

COPY target/bookstudio-v1-0.0.1-SNAPSHOT.war /usr/local/tomcat/webapps/ROOT.war

EXPOSE 8080

CMD ["catalina.sh", "run"]
