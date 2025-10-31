package wilp.bits_pilani.ac.in.user_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import wilp.bits_pilani.ac.in.user_service.domain.entity.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
