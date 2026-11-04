using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Terranova.Domain.Entities;
using Terranova.Infrastructure.Identity;

namespace Terranova.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
	public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
	{
	}

	public DbSet<Favourite> Favourites => Set<Favourite>();

	protected override void OnModelCreating(ModelBuilder builder)
	{
		base.OnModelCreating(builder);

		builder.Entity<Favourite>(entity =>
		{
			entity.HasKey(newFav => new { newFav.UserId, newFav.RawgGameId });
			entity.Property(newFav => newFav.CreatedAt).HasDefaultValueSql("now()");
			entity.ToTable(newFav => newFav.HasCheckConstraint("CK_Favourites_RawgGameId_Positive", "\"RawgGameId\" > 0"));
			entity.HasOne<ApplicationUser>()
					.WithMany()
					.HasForeignKey(newFav => newFav.UserId)
					.OnDelete(DeleteBehavior.Cascade);
		});
	}
}
